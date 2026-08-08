import { batch, execute, queryAll } from "@/lib/db";
import {
  candidateSessionDates,
  fetchText,
  formatBseDate,
  parseCsv,
  toIsoDate,
} from "./http";

export type BsePriceRow = {
  symbol: string;
  isin?: string;
  scripCode?: string;
  close: number;
  volume: number;
  sessionDate: string;
};

export async function fetchBseBhavcopy(
  session: Date
): Promise<{ ok: boolean; rows: BsePriceRow[]; sessionDate: string; error?: string }> {
  const sessionDate = toIsoDate(session);
  const ymd = formatBseDate(session);
  // UDiFF equity bhavcopy (includes SGB tickers in CM segment)
  const urls = [
    `https://www.bseindia.com/download/BhavCopy/Equity/BhavCopy_BSE_CM_0_0_0_${ymd}_F_0000.CSV`,
    `https://www.bseindia.com/download/BhavCopy/Debt/BhavCopy_BSE_DEBT_0_0_0_${ymd}_F_0000.CSV`,
  ];

  for (const url of urls) {
    const { ok, text } = await fetchText(url, {
      headers: { Referer: "https://www.bseindia.com/" },
    });
    if (!ok || text.toLowerCase().includes("<html")) {
      continue;
    }
    const parsed = parseCsv(text);
    const rows: BsePriceRow[] = [];
    for (const r of parsed) {
      const symbol = (
        r.TckrSymb ||
        r.SYMBOL ||
        r.Symbol ||
        r.SC_NAME ||
        ""
      )
        .trim()
        .toUpperCase();
      if (!symbol.startsWith("SGB") && !symbol.includes("GOLD")) continue;
      const close = Number(
        String(r.ClsPric || r.CLOSE || r.Close || r.Last || "0").replace(/,/g, "")
      );
      const volume = Number(
        String(r.TtlTradgVol || r.VOLUME || r.NoOfShares || "0").replace(/,/g, "")
      );
      const isin = (r.ISIN || r.Isin || r.FinInstrmId || "").trim();
      const scripCode = (r.FinInstrmId || r.SC_CODE || r.scripcode || "").trim();
      if (!Number.isFinite(close) || close <= 0) continue;
      rows.push({
        symbol,
        isin: /^IN\d{10}$/.test(isin) ? isin : undefined,
        scripCode: scripCode || undefined,
        close,
        volume: Number.isFinite(volume) ? volume : 0,
        sessionDate,
      });
    }
    if (rows.length) return { ok: true, rows, sessionDate };
  }
  return { ok: false, rows: [], sessionDate, error: `BSE bhavcopy missing for ${sessionDate}` };
}

export async function ingestBsePrices(
  preferDate?: string
): Promise<{ sessionDate: string | null; count: number; error?: string }> {
  const start = preferDate
    ? new Date(preferDate + "T00:00:00Z")
    : new Date();
  const candidates = preferDate
    ? [new Date(preferDate + "T00:00:00Z")]
    : candidateSessionDates(start, 14);

  let lastError = "no session found";
  for (const d of candidates) {
    const result = await fetchBseBhavcopy(d);
    if (!result.ok) {
      lastError = result.error ?? lastError;
      continue;
    }

    const trancheRows = await queryAll<{
      isin: string;
      nse_symbol: string | null;
      tranche_code: string;
    }>(`SELECT isin, nse_symbol, tranche_code FROM tranches`);

    const bySymbol = new Map(
      trancheRows.flatMap((t) => {
        const e: [string, string][] = [[t.tranche_code.toUpperCase(), t.isin]];
        if (t.nse_symbol) e.push([t.nse_symbol.toUpperCase(), t.isin]);
        return e;
      })
    );
    const byIsin = new Set(trancheRows.map((r) => r.isin));

    const stmts: { sql: string; args: (string | number | null)[] }[] = [];
    let count = 0;
    for (const row of result.rows) {
      let isin = row.isin && byIsin.has(row.isin) ? row.isin : undefined;
      if (!isin) isin = bySymbol.get(row.symbol);
      if (!isin && row.isin) {
        isin = row.isin;
        stmts.push({
          sql: `INSERT INTO tranches (isin, tranche_code, nse_symbol, bse_scrip_code, coupon_pa, units_per_bond, active)
                VALUES (?, ?, ?, ?, 2.5, 1.0, 1)
                ON CONFLICT(isin) DO UPDATE SET
                  bse_scrip_code = COALESCE(excluded.bse_scrip_code, bse_scrip_code),
                  updated_at = datetime('now')`,
          args: [isin, row.symbol, row.symbol, row.scripCode ?? null],
        });
        byIsin.add(isin);
      }
      if (!isin) continue;
      if (row.scripCode) {
        stmts.push({
          sql: `UPDATE tranches SET bse_scrip_code = ?, updated_at = datetime('now') WHERE isin = ?`,
          args: [row.scripCode, isin],
        });
      }
      stmts.push({
        sql: `INSERT INTO prices (isin, exchange, session_date, close, volume, source, verified, outlier)
              VALUES (?, 'BSE', ?, ?, ?, 'bse_bhavcopy', 0, 0)
              ON CONFLICT(isin, exchange, session_date) DO UPDATE SET
                close = excluded.close,
                volume = excluded.volume,
                source = excluded.source,
                fetched_at = datetime('now')`,
        args: [isin, result.sessionDate, row.close, row.volume],
      });
      count++;
    }
    stmts.push({
      sql: `INSERT INTO trading_calendar (session_date, bse_ok) VALUES (?, 1)
            ON CONFLICT(session_date) DO UPDATE SET bse_ok = 1`,
      args: [result.sessionDate],
    });

    const chunk = 80;
    for (let i = 0; i < stmts.length; i += chunk) {
      try {
        await batch(stmts.slice(i, i + chunk));
      } catch {
        for (const s of stmts.slice(i, i + chunk)) {
          try {
            await execute(s.sql, s.args);
          } catch {
            /* ignore */
          }
        }
      }
    }
    return { sessionDate: result.sessionDate, count };
  }
  return { sessionDate: null, count: 0, error: lastError };
}
