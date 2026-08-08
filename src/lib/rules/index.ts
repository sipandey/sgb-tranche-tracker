import { batch, execute, getSettings, queryAll, queryOne } from "@/lib/db";
import {
  diversifySuggestions,
  shouldSwitch,
  signalFromDiscount,
  sizeSuggestion,
  type RankedTranche,
} from "./engine";

export async function runRulesForSession(sessionDate: string) {
  const settings = await getSettings();

  const rows = await queryAll<
    RankedTranche & { market_price: number; fair_value: number }
  >(
    `SELECT m.*, t.tranche_code, t.maturity_date
     FROM daily_metrics m
     JOIN tranches t ON t.isin = m.isin
     WHERE m.session_date = ?
     ORDER BY m.discount_pct DESC`,
    [sessionDate]
  );

  const ranked: RankedTranche[] = rows.map((r) => ({
    isin: r.isin,
    tranche_code: r.tranche_code,
    discount_pct: Number(r.discount_pct),
    volume: Number(r.volume),
    maturity_date: r.maturity_date,
    liquidity_ok: Number(r.liquidity_ok),
    price_verified: Number(r.price_verified),
    signal: signalFromDiscount(Number(r.discount_pct)),
  }));

  await batch(
    ranked.map((r) => ({
      sql: `UPDATE daily_metrics SET signal = ? WHERE isin = ? AND session_date = ?`,
      args: [r.signal, r.isin, sessionDate],
    }))
  );

  const cheapest = ranked[0];
  const suggestions = diversifySuggestions(
    ranked,
    settings.dry_powder_remaining_inr,
    settings.min_volume_for_large_deploy
  );

  const held = await queryAll<{
    isin: string;
    tranche_code: string;
    units: number;
    discount_pct: number | null;
  }>(
    `SELECT pl.isin, t.tranche_code, SUM(pl.units) AS units,
            (SELECT discount_pct FROM daily_metrics WHERE isin = pl.isin AND session_date = ?) AS discount_pct
     FROM position_lots pl
     JOIN tranches t ON t.isin = pl.isin
     GROUP BY pl.isin`,
    [sessionDate]
  );

  await execute(`DELETE FROM action_log WHERE session_date = ?`, [sessionDate]);

  const cum = await queryOne<{ u: number; c: number }>(
    `SELECT COALESCE(SUM(units),0) AS u, COALESCE(SUM(units * cost_per_unit),0) AS c FROM position_lots`
  );
  const cumulativeUnits = Number(cum?.u ?? 0);
  const cumulativeCapital = Number(cum?.c ?? 0);

  const logStmts: { sql: string; args: (string | number | null)[] }[] = [];

  const pushLog = (
    isin: string | null,
    tranche_code: string | null,
    signal: string,
    discount_pct: number | null,
    size_suggestion: number | null,
    note: string | null
  ) => {
    logStmts.push({
      sql: `INSERT INTO action_log (
        session_date, isin, tranche_code, signal, discount_pct,
        size_suggestion, note, cumulative_units, cumulative_capital
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        sessionDate,
        isin,
        tranche_code,
        signal,
        discount_pct,
        size_suggestion,
        note,
        cumulativeUnits,
        cumulativeCapital,
      ],
    });
  };

  for (const h of held) {
    const heldDisc = Number(h.discount_pct ?? 0);
    const better = ranked.find(
      (c) =>
        c.isin !== h.isin &&
        shouldSwitch({
          heldDiscountPct: heldDisc,
          candidateDiscountPct: c.discount_pct,
          switchThresholdPct: settings.switch_threshold_pct,
        })
    );
    if (better) {
      pushLog(
        h.isin,
        h.tranche_code,
        "switch",
        heldDisc,
        null,
        `Switch candidate ${better.tranche_code} discount gap exceeds ${settings.switch_threshold_pct}% after costs`
      );
    } else {
      pushLog(
        h.isin,
        h.tranche_code,
        "hold",
        heldDisc,
        null,
        "Default: hold to maturity — switch not justified"
      );
    }
  }

  for (const s of suggestions) {
    const row = ranked.find((r) => r.isin === s.isin)!;
    if (row.signal === "skip") {
      pushLog(
        s.isin,
        s.tranche_code,
        "skip",
        row.discount_pct,
        0,
        `Premium — redirect to cheapest: ${cheapest?.tranche_code ?? "n/a"}`
      );
      continue;
    }
    pushLog(
      s.isin,
      s.tranche_code,
      s.signal,
      row.discount_pct,
      s.amount,
      s.note || null
    );
  }

  for (const r of ranked.filter((x) => x.signal === "skip").slice(0, 10)) {
    if (suggestions.some((s) => s.isin === r.isin)) continue;
    pushLog(
      r.isin,
      r.tranche_code,
      "skip",
      r.discount_pct,
      0,
      `Premium — redirect capital to ${cheapest?.tranche_code ?? "cheapest discount tranche"}`
    );
  }

  if (logStmts.length) await batch(logStmts);

  const watched = new Set(settings.watched_isins);
  const thresholds = [0, 3, 5, 7];
  await execute(`DELETE FROM alerts WHERE session_date = ?`, [sessionDate]);

  const alertStmts: { sql: string; args: (string | number)[] }[] = [];
  for (const r of ranked) {
    const crossed = [...thresholds].reverse().find((th) => r.discount_pct >= th);
    if (crossed !== undefined && (watched.size === 0 || watched.has(r.isin))) {
      if (watched.has(r.isin) || r.discount_pct >= 5) {
        alertStmts.push({
          sql: `INSERT INTO alerts (isin, tranche_code, session_date, threshold_pct, discount_pct, message)
                VALUES (?, ?, ?, ?, ?, ?)`,
          args: [
            r.isin,
            r.tranche_code,
            sessionDate,
            crossed,
            r.discount_pct,
            `${r.tranche_code} discount ${r.discount_pct.toFixed(2)}% crossed ${crossed}% threshold`,
          ],
        });
      }
    }
  }
  if (alertStmts.length) await batch(alertStmts);

  const alertCount = await queryOne<{ c: number }>(
    `SELECT COUNT(*) AS c FROM alerts WHERE session_date = ?`,
    [sessionDate]
  );

  return {
    sessionDate,
    rankedCount: ranked.length,
    suggestions: suggestions.length,
    alerts: Number(alertCount?.c ?? 0),
  };
}

export { signalFromDiscount, sizeSuggestion, diversifySuggestions, shouldSwitch };
