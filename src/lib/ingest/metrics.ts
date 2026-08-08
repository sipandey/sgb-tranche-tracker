import { getDb, getSettings } from "@/lib/db";
import {
  discountPct,
  fairValuePerUnit,
  yearsBetween,
} from "@/lib/calc";
import { signalFromDiscount } from "@/lib/rules/engine";
import { getLatestGold } from "./ibja";
import { pickMarketPrice } from "./cross-check";

export function materializeDailyMetrics(sessionDate: string): number {
  const db = getDb();
  const settings = getSettings();
  const gold = getLatestGold(sessionDate);
  if (!gold) return 0;

  const tranches = db
    .prepare(
      `SELECT isin, maturity_date, units_per_bond FROM tranches WHERE active = 1`
    )
    .all() as {
    isin: string;
    maturity_date: string | null;
    units_per_bond: number;
  }[];

  const upsert = db.prepare(`
    INSERT INTO daily_metrics (
      isin, session_date, market_price, fair_value, discount_pct,
      volume, liquidity_ok, price_verified, price_outlier,
      years_to_maturity, signal
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

  let count = 0;
  const tx = db.transaction(() => {
    for (const t of tranches) {
      const px = pickMarketPrice(sessionDate, t.isin);
      if (!px) continue;
      const fv = fairValuePerUnit(gold.rate_per_10g, t.units_per_bond);
      const disc = discountPct(fv, px.close);
      const ytmYears = t.maturity_date
        ? yearsBetween(sessionDate, t.maturity_date)
        : null;
      const signal = signalFromDiscount(disc);
      const liquidityOk =
        px.volume >= settings.min_volume_for_large_deploy ? 1 : 0;
      upsert.run(
        t.isin,
        sessionDate,
        px.close,
        fv,
        disc,
        px.volume,
        liquidityOk,
        px.verified ? 1 : 0,
        px.outlier ? 1 : 0,
        ytmYears,
        signal
      );
      count++;
    }
  });
  tx();
  return count;
}
