import { getDb, updateSettings } from "@/lib/db";
import { fairValuePerUnit, discountPct, yearsBetween } from "@/lib/calc";
import { signalFromDiscount } from "@/lib/rules/engine";
import { runRulesForSession } from "@/lib/rules";

/**
 * When live NSE/BSE/IBJA are unreachable (WAF/geo), seed a deterministic
 * demo session so the UI and rules engine can be exercised.
 */
export function seedDemoSession(sessionDate = "2026-08-07"): {
  sessionDate: string;
  metrics: number;
} {
  const db = getDb();
  const goldRate = 149020; // ₹/10g illustrative IBJA 999

  db.prepare(
    `INSERT INTO gold_spot (session_date, rate_per_10g, purity, source)
     VALUES (?, ?, 999, 'ibja_scrape')
     ON CONFLICT(session_date, source) DO UPDATE SET rate_per_10g = excluded.rate_per_10g`
  ).run(sessionDate, goldRate);

  const tranches = db
    .prepare(
      `SELECT isin, tranche_code, nse_symbol, maturity_date, issue_price, units_per_bond
       FROM tranches WHERE active = 1`
    )
    .all() as {
    isin: string;
    tranche_code: string;
    nse_symbol: string | null;
    maturity_date: string | null;
    issue_price: number | null;
    units_per_bond: number;
  }[];

  const fv = fairValuePerUnit(goldRate, 1);
  const upsertPrice = db.prepare(`
    INSERT INTO prices (isin, exchange, session_date, close, volume, source, verified, outlier)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(isin, exchange, session_date) DO UPDATE SET
      close = excluded.close, volume = excluded.volume,
      verified = excluded.verified, outlier = excluded.outlier
  `);
  const upsertMetric = db.prepare(`
    INSERT INTO daily_metrics (
      isin, session_date, market_price, fair_value, discount_pct,
      volume, liquidity_ok, price_verified, price_outlier, years_to_maturity, signal
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(isin, session_date) DO UPDATE SET
      market_price = excluded.market_price,
      fair_value = excluded.fair_value,
      discount_pct = excluded.discount_pct,
      volume = excluded.volume,
      liquidity_ok = excluded.liquidity_ok,
      price_verified = excluded.price_verified,
      price_outlier = excluded.price_outlier,
      years_to_maturity = excluded.years_to_maturity,
      signal = excluded.signal
  `);

  // Deterministic pseudo-discount spread by hashing code
  function hash(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  let metrics = 0;
  const tx = db.transaction(() => {
    for (const t of tranches) {
      if (t.maturity_date && t.maturity_date < sessionDate) continue;
      const h = hash(t.tranche_code);
      const disc = ((h % 1200) / 100) - 3; // -3% to +9%
      const close = fv * (1 - disc / 100);
      const volume = 20 + (h % 500);
      const nseClose = close;
      const bseClose = close * (1 + ((h % 5) - 2) / 1000); // tiny exchange diff
      const outlier = Math.abs(nseClose - bseClose) / close > 0.01;
      const verified = !outlier;

      upsertPrice.run(
        t.isin,
        "NSE",
        sessionDate,
        Math.round(nseClose * 100) / 100,
        volume,
        "demo",
        verified ? 1 : 0,
        outlier ? 1 : 0
      );
      upsertPrice.run(
        t.isin,
        "BSE",
        sessionDate,
        Math.round(bseClose * 100) / 100,
        Math.floor(volume * 0.6),
        "demo",
        verified ? 1 : 0,
        outlier ? 1 : 0
      );

      const market = Math.round(nseClose * 100) / 100;
      const d = discountPct(fv, market);
      const ytm = t.maturity_date ? yearsBetween(sessionDate, t.maturity_date) : null;
      upsertMetric.run(
        t.isin,
        sessionDate,
        market,
        fv,
        d,
        volume,
        volume >= 100 ? 1 : 0,
        verified ? 1 : 0,
        outlier ? 1 : 0,
        ytm,
        signalFromDiscount(d)
      );
      metrics++;
    }
    db.prepare(
      `INSERT INTO trading_calendar (session_date, nse_ok, bse_ok) VALUES (?, 1, 1)
       ON CONFLICT(session_date) DO UPDATE SET nse_ok = 1, bse_ok = 1`
    ).run(sessionDate);
  });
  tx();

  updateSettings({ last_session_date: sessionDate });
  runRulesForSession(sessionDate);
  return { sessionDate, metrics };
}
