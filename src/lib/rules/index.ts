import { getDb, getSettings } from "@/lib/db";
import {
  diversifySuggestions,
  shouldSwitch,
  signalFromDiscount,
  sizeSuggestion,
  type RankedTranche,
} from "./engine";

export function runRulesForSession(sessionDate: string) {
  const db = getDb();
  const settings = getSettings();

  const rows = db
    .prepare(
      `SELECT m.*, t.tranche_code, t.maturity_date
       FROM daily_metrics m
       JOIN tranches t ON t.isin = m.isin
       WHERE m.session_date = ?
       ORDER BY m.discount_pct DESC`
    )
    .all(sessionDate) as (RankedTranche & {
    market_price: number;
    fair_value: number;
  })[];

  const ranked: RankedTranche[] = rows.map((r) => ({
    isin: r.isin,
    tranche_code: r.tranche_code,
    discount_pct: r.discount_pct,
    volume: r.volume,
    maturity_date: r.maturity_date,
    liquidity_ok: r.liquidity_ok,
    price_verified: r.price_verified,
    signal: signalFromDiscount(r.discount_pct),
  }));

  // Update signals on metrics
  const upd = db.prepare(
    `UPDATE daily_metrics SET signal = ? WHERE isin = ? AND session_date = ?`
  );
  const txSignals = db.transaction(() => {
    for (const r of ranked) {
      upd.run(r.signal, r.isin, sessionDate);
    }
  });
  txSignals();

  const cheapest = ranked.find((r) => r.price_verified || r.discount_pct === ranked[0]?.discount_pct);
  const suggestions = diversifySuggestions(
    ranked,
    settings.dry_powder_remaining_inr,
    settings.min_volume_for_large_deploy
  );

  // Positions for hold/switch logic
  const held = db
    .prepare(
      `SELECT pl.isin, t.tranche_code, SUM(pl.units) AS units,
              (SELECT discount_pct FROM daily_metrics WHERE isin = pl.isin AND session_date = ?) AS discount_pct
       FROM position_lots pl
       JOIN tranches t ON t.isin = pl.isin
       GROUP BY pl.isin`
    )
    .all(sessionDate) as {
    isin: string;
    tranche_code: string;
    units: number;
    discount_pct: number | null;
  }[];

  db.prepare(`DELETE FROM action_log WHERE session_date = ?`).run(sessionDate);

  const insertLog = db.prepare(`
    INSERT INTO action_log (
      session_date, isin, tranche_code, signal, discount_pct,
      size_suggestion, note, cumulative_units, cumulative_capital
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const cum = db
    .prepare(
      `SELECT COALESCE(SUM(units),0) AS u, COALESCE(SUM(units * cost_per_unit),0) AS c FROM position_lots`
    )
    .get() as { u: number; c: number };

  const cumulativeUnits = cum.u;
  const cumulativeCapital = cum.c;

  const txLog = db.transaction(() => {
    // Hold posture for held tranches
    for (const h of held) {
      const heldDisc = h.discount_pct ?? 0;
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
        insertLog.run(
          sessionDate,
          h.isin,
          h.tranche_code,
          "switch",
          heldDisc,
          null,
          `Switch candidate ${better.tranche_code} discount gap exceeds ${settings.switch_threshold_pct}% after costs`,
          cumulativeUnits,
          cumulativeCapital
        );
      } else {
        insertLog.run(
          sessionDate,
          h.isin,
          h.tranche_code,
          "hold",
          heldDisc,
          null,
          "Default: hold to maturity — switch not justified",
          cumulativeUnits,
          cumulativeCapital
        );
      }
    }

    for (const s of suggestions) {
      const row = ranked.find((r) => r.isin === s.isin)!;
      if (row.signal === "skip") {
        insertLog.run(
          sessionDate,
          s.isin,
          s.tranche_code,
          "skip",
          row.discount_pct,
          0,
          `Premium — redirect to cheapest: ${cheapest?.tranche_code ?? "n/a"}`,
          cumulativeUnits,
          cumulativeCapital
        );
        continue;
      }
      insertLog.run(
        sessionDate,
        s.isin,
        s.tranche_code,
        s.signal,
        row.discount_pct,
        s.amount,
        s.note || null,
        cumulativeUnits,
        cumulativeCapital
      );
    }

    // Log skips for premium names not in suggestions
    for (const r of ranked.filter((x) => x.signal === "skip").slice(0, 10)) {
      if (suggestions.some((s) => s.isin === r.isin)) continue;
      insertLog.run(
        sessionDate,
        r.isin,
        r.tranche_code,
        "skip",
        r.discount_pct,
        0,
        `Premium — redirect capital to ${cheapest?.tranche_code ?? "cheapest discount tranche"}`,
        cumulativeUnits,
        cumulativeCapital
      );
    }
  });
  txLog();

  // Alerts for watched ISINs crossing thresholds
  const watched = new Set(settings.watched_isins);
  const thresholds = [0, 3, 5, 7];
  const insertAlert = db.prepare(`
    INSERT INTO alerts (isin, tranche_code, session_date, threshold_pct, discount_pct, message)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  // Avoid duplicate alerts for same session+isin+threshold
  db.prepare(`DELETE FROM alerts WHERE session_date = ?`).run(sessionDate);

  for (const r of ranked) {
    if (watched.size > 0 && !watched.has(r.isin)) continue;
    for (const th of thresholds) {
      if (r.discount_pct >= th) {
        // Only alert on the highest crossed threshold
      }
    }
    const crossed = [...thresholds].reverse().find((th) => r.discount_pct >= th);
    if (crossed !== undefined && (watched.size === 0 || watched.has(r.isin))) {
      if (watched.has(r.isin) || r.discount_pct >= 5) {
        insertAlert.run(
          r.isin,
          r.tranche_code,
          sessionDate,
          crossed,
          r.discount_pct,
          `${r.tranche_code} discount ${r.discount_pct.toFixed(2)}% crossed ${crossed}% threshold`
        );
      }
    }
  }

  return {
    sessionDate,
    rankedCount: ranked.length,
    suggestions: suggestions.length,
    alerts: (
      db
        .prepare(`SELECT COUNT(*) AS c FROM alerts WHERE session_date = ?`)
        .get(sessionDate) as { c: number }
    ).c,
  };
}

export { signalFromDiscount, sizeSuggestion, diversifySuggestions, shouldSwitch };
