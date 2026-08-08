import { getDb, getSettings } from "@/lib/db";

/**
 * Cross-check NSE vs BSE closes for a session.
 * If relative diff > threshold → mark both outlier, do NOT average.
 * If within band → mark both verified.
 * Single-source prices stay unverified.
 */
export function crossCheckPrices(sessionDate: string): {
  verified: number;
  outliers: number;
  singleSource: number;
} {
  const db = getDb();
  const settings = getSettings();
  const threshold = settings.price_outlier_threshold_pct / 100;

  const nse = db
    .prepare(
      `SELECT isin, close, volume FROM prices WHERE exchange = 'NSE' AND session_date = ?`
    )
    .all(sessionDate) as { isin: string; close: number; volume: number }[];
  const bse = db
    .prepare(
      `SELECT isin, close, volume FROM prices WHERE exchange = 'BSE' AND session_date = ?`
    )
    .all(sessionDate) as { isin: string; close: number; volume: number }[];

  const bseMap = new Map(bse.map((r) => [r.isin, r]));
  const nseMap = new Map(nse.map((r) => [r.isin, r]));
  const allIsins = new Set([...nseMap.keys(), ...bseMap.keys()]);

  let verified = 0;
  let outliers = 0;
  let singleSource = 0;

  const mark = db.prepare(
    `UPDATE prices SET verified = ?, outlier = ? WHERE isin = ? AND exchange = ? AND session_date = ?`
  );

  const tx = db.transaction(() => {
    for (const isin of allIsins) {
      const a = nseMap.get(isin);
      const b = bseMap.get(isin);
      if (a && b) {
        const mid = (a.close + b.close) / 2;
        const rel = mid > 0 ? Math.abs(a.close - b.close) / mid : 0;
        if (rel > threshold) {
          mark.run(0, 1, isin, "NSE", sessionDate);
          mark.run(0, 1, isin, "BSE", sessionDate);
          outliers++;
        } else {
          mark.run(1, 0, isin, "NSE", sessionDate);
          mark.run(1, 0, isin, "BSE", sessionDate);
          verified++;
        }
      } else {
        const ex = a ? "NSE" : "BSE";
        mark.run(0, 0, isin, ex, sessionDate);
        singleSource++;
      }
    }
  });
  tx();

  return { verified, outliers, singleSource };
}

/**
 * Pick display price for a tranche: prefer verified; if both verified use
 * volume-weighted preference toward higher-liquidity exchange; never silent-average outliers.
 */
export function pickMarketPrice(
  sessionDate: string,
  isin: string
): {
  close: number;
  volume: number;
  verified: boolean;
  outlier: boolean;
  exchange: string;
} | null {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT exchange, close, volume, verified, outlier FROM prices
       WHERE isin = ? AND session_date = ?`
    )
    .all(isin, sessionDate) as {
    exchange: string;
    close: number;
    volume: number;
    verified: number;
    outlier: number;
  }[];
  if (!rows.length) return null;

  const verified = rows.filter((r) => r.verified);
  const pool = verified.length ? verified : rows.filter((r) => !r.outlier);
  const use = pool.length ? pool : rows;
  use.sort((a, b) => b.volume - a.volume);
  const best = use[0];
  return {
    close: best.close,
    volume: rows.reduce((s, r) => s + r.volume, 0),
    verified: best.verified === 1,
    outlier: best.outlier === 1,
    exchange: best.exchange,
  };
}
