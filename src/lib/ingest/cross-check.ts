import { batch, getSettings, queryAll } from "@/lib/db";

/**
 * Cross-check NSE vs BSE closes for a session.
 * If relative diff > threshold → mark both outlier, do NOT average.
 * If within band → mark both verified.
 * Single-source prices stay unverified.
 */
export async function crossCheckPrices(sessionDate: string): Promise<{
  verified: number;
  outliers: number;
  singleSource: number;
}> {
  const settings = await getSettings();
  const threshold = settings.price_outlier_threshold_pct / 100;

  const nse = await queryAll<{ isin: string; close: number; volume: number }>(
    `SELECT isin, close, volume FROM prices WHERE exchange = 'NSE' AND session_date = ?`,
    [sessionDate]
  );
  const bse = await queryAll<{ isin: string; close: number; volume: number }>(
    `SELECT isin, close, volume FROM prices WHERE exchange = 'BSE' AND session_date = ?`,
    [sessionDate]
  );

  const bseMap = new Map(bse.map((r) => [r.isin, r]));
  const nseMap = new Map(nse.map((r) => [r.isin, r]));
  const allIsins = new Set([...nseMap.keys(), ...bseMap.keys()]);

  let verified = 0;
  let outliers = 0;
  let singleSource = 0;
  const stmts: { sql: string; args: (string | number)[] }[] = [];

  for (const isin of allIsins) {
    const a = nseMap.get(isin);
    const b = bseMap.get(isin);
    if (a && b) {
      const mid = (Number(a.close) + Number(b.close)) / 2;
      const rel =
        mid > 0 ? Math.abs(Number(a.close) - Number(b.close)) / mid : 0;
      if (rel > threshold) {
        stmts.push({
          sql: `UPDATE prices SET verified = ?, outlier = ? WHERE isin = ? AND exchange = ? AND session_date = ?`,
          args: [0, 1, isin, "NSE", sessionDate],
        });
        stmts.push({
          sql: `UPDATE prices SET verified = ?, outlier = ? WHERE isin = ? AND exchange = ? AND session_date = ?`,
          args: [0, 1, isin, "BSE", sessionDate],
        });
        outliers++;
      } else {
        stmts.push({
          sql: `UPDATE prices SET verified = ?, outlier = ? WHERE isin = ? AND exchange = ? AND session_date = ?`,
          args: [1, 0, isin, "NSE", sessionDate],
        });
        stmts.push({
          sql: `UPDATE prices SET verified = ?, outlier = ? WHERE isin = ? AND exchange = ? AND session_date = ?`,
          args: [1, 0, isin, "BSE", sessionDate],
        });
        verified++;
      }
    } else {
      const ex = a ? "NSE" : "BSE";
      stmts.push({
        sql: `UPDATE prices SET verified = ?, outlier = ? WHERE isin = ? AND exchange = ? AND session_date = ?`,
        args: [0, 0, isin, ex, sessionDate],
      });
      singleSource++;
    }
  }

  if (stmts.length) await batch(stmts);
  return { verified, outliers, singleSource };
}

export async function pickMarketPrice(
  sessionDate: string,
  isin: string
): Promise<{
  close: number;
  volume: number;
  verified: boolean;
  outlier: boolean;
  exchange: string;
} | null> {
  const rows = await queryAll<{
    exchange: string;
    close: number;
    volume: number;
    verified: number;
    outlier: number;
  }>(
    `SELECT exchange, close, volume, verified, outlier FROM prices
     WHERE isin = ? AND session_date = ?`,
    [isin, sessionDate]
  );
  if (!rows.length) return null;

  const verifiedRows = rows.filter((r) => Number(r.verified));
  const pool = verifiedRows.length
    ? verifiedRows
    : rows.filter((r) => !Number(r.outlier));
  const use = pool.length ? pool : rows;
  use.sort((a, b) => Number(b.volume) - Number(a.volume));
  const best = use[0];
  return {
    close: Number(best.close),
    volume: rows.reduce((s, r) => s + Number(r.volume), 0),
    verified: Number(best.verified) === 1,
    outlier: Number(best.outlier) === 1,
    exchange: best.exchange,
  };
}
