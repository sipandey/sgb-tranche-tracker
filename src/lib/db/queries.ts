import { queryAll, queryOne } from "@/lib/db";
import type { DailyMetricRow, Tranche } from "@/lib/db/types";

export async function getLastSessionDate(): Promise<string | null> {
  const fromSettings = await queryOne<{ value: string }>(
    `SELECT value FROM settings WHERE key = 'last_session_date'`
  );
  if (fromSettings?.value) return fromSettings.value;
  const row = await queryOne<{ session_date: string }>(
    `SELECT session_date FROM trading_calendar ORDER BY session_date DESC LIMIT 1`
  );
  return row?.session_date ?? null;
}

export async function getDiscountRanking(
  sessionDate: string
): Promise<DailyMetricRow[]> {
  return queryAll<DailyMetricRow>(
    `SELECT m.*, t.tranche_code, t.issue_date, t.maturity_date, t.issue_price,
            t.coupon_pa, t.nse_symbol
     FROM daily_metrics m
     JOIN tranches t ON t.isin = m.isin
     WHERE m.session_date = ?
     ORDER BY m.discount_pct DESC`,
    [sessionDate]
  );
}

export async function getTrancheByCode(code: string): Promise<Tranche | null> {
  return queryOne<Tranche>(
    `SELECT * FROM tranches WHERE tranche_code = ? OR nse_symbol = ?`,
    [code, code]
  );
}

export async function getTrancheMetrics(
  isin: string,
  sessionDate: string
): Promise<DailyMetricRow | null> {
  return queryOne<DailyMetricRow>(
    `SELECT m.*, t.tranche_code, t.issue_date, t.maturity_date, t.issue_price,
            t.coupon_pa, t.nse_symbol
     FROM daily_metrics m
     JOIN tranches t ON t.isin = m.isin
     WHERE m.isin = ? AND m.session_date = ?`,
    [isin, sessionDate]
  );
}

export async function getPriceHistory(isin: string, limit = 90) {
  return queryAll<{
    session_date: string;
    exchange: string;
    close: number;
    volume: number;
    verified: number;
    outlier: number;
  }>(
    `SELECT session_date, exchange, close, volume, verified, outlier
     FROM prices WHERE isin = ? ORDER BY session_date DESC LIMIT ?`,
    [isin, limit]
  );
}

export async function getMetricsHistory(isin: string, limit = 90) {
  return queryAll<{
    session_date: string;
    market_price: number;
    fair_value: number;
    discount_pct: number;
    volume: number;
    signal: string | null;
  }>(
    `SELECT session_date, market_price, fair_value, discount_pct, volume, signal
     FROM daily_metrics WHERE isin = ? ORDER BY session_date DESC LIMIT ?`,
    [isin, limit]
  );
}

export async function getPositions() {
  return queryAll<{
    id: number;
    isin: string;
    units: number;
    cost_per_unit: number;
    purchase_date: string;
    notes: string | null;
    tranche_code: string;
    maturity_date: string | null;
    issue_price: number | null;
    coupon_pa: number;
    units_per_bond: number;
  }>(
    `SELECT pl.id, pl.isin, pl.units, pl.cost_per_unit, pl.purchase_date, pl.notes,
            t.tranche_code, t.maturity_date, t.issue_price, t.coupon_pa, t.units_per_bond
     FROM position_lots pl
     JOIN tranches t ON t.isin = pl.isin
     ORDER BY pl.purchase_date`
  );
}

export async function getActionLog(limit = 200) {
  return queryAll<{
    id: number;
    session_date: string;
    isin: string | null;
    tranche_code: string | null;
    signal: string;
    discount_pct: number | null;
    size_suggestion: number | null;
    note: string | null;
    cumulative_units: number | null;
    cumulative_capital: number | null;
    created_at: string;
  }>(`SELECT * FROM action_log ORDER BY session_date DESC, id DESC LIMIT ?`, [
    limit,
  ]);
}

export async function getAlerts(unackedOnly = false, limit = 50) {
  if (unackedOnly) {
    return queryAll(
      `SELECT * FROM alerts WHERE acknowledged = 0 ORDER BY created_at DESC LIMIT ?`,
      [limit]
    );
  }
  return queryAll(`SELECT * FROM alerts ORDER BY created_at DESC LIMIT ?`, [
    limit,
  ]);
}

export async function getActiveTranches(): Promise<Tranche[]> {
  return queryAll<Tranche>(
    `SELECT * FROM tranches WHERE active = 1 ORDER BY tranche_code`
  );
}
