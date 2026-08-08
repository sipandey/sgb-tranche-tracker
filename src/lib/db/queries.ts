import { getDb } from "@/lib/db";
import type { DailyMetricRow, Tranche } from "@/lib/db/types";

export function getLastSessionDate(): string | null {
  const db = getDb();
  const fromSettings = db
    .prepare(`SELECT value FROM settings WHERE key = 'last_session_date'`)
    .get() as { value: string } | undefined;
  if (fromSettings?.value) return fromSettings.value;
  const row = db
    .prepare(`SELECT session_date FROM trading_calendar ORDER BY session_date DESC LIMIT 1`)
    .get() as { session_date: string } | undefined;
  return row?.session_date ?? null;
}

export function getDiscountRanking(sessionDate: string): DailyMetricRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT m.*, t.tranche_code, t.issue_date, t.maturity_date, t.issue_price,
              t.coupon_pa, t.nse_symbol
       FROM daily_metrics m
       JOIN tranches t ON t.isin = m.isin
       WHERE m.session_date = ?
       ORDER BY m.discount_pct DESC`
    )
    .all(sessionDate) as DailyMetricRow[];
}

export function getTrancheByCode(code: string): Tranche | null {
  const db = getDb();
  return (
    (db
      .prepare(`SELECT * FROM tranches WHERE tranche_code = ? OR nse_symbol = ?`)
      .get(code, code) as Tranche | undefined) ?? null
  );
}

export function getTrancheMetrics(
  isin: string,
  sessionDate: string
): DailyMetricRow | null {
  const db = getDb();
  return (
    (db
      .prepare(
        `SELECT m.*, t.tranche_code, t.issue_date, t.maturity_date, t.issue_price,
                t.coupon_pa, t.nse_symbol
         FROM daily_metrics m
         JOIN tranches t ON t.isin = m.isin
         WHERE m.isin = ? AND m.session_date = ?`
      )
      .get(isin, sessionDate) as DailyMetricRow | undefined) ?? null
  );
}

export function getPriceHistory(isin: string, limit = 90) {
  const db = getDb();
  return db
    .prepare(
      `SELECT session_date, exchange, close, volume, verified, outlier
       FROM prices WHERE isin = ? ORDER BY session_date DESC LIMIT ?`
    )
    .all(isin, limit) as {
    session_date: string;
    exchange: string;
    close: number;
    volume: number;
    verified: number;
    outlier: number;
  }[];
}

export function getMetricsHistory(isin: string, limit = 90) {
  const db = getDb();
  return db
    .prepare(
      `SELECT session_date, market_price, fair_value, discount_pct, volume, signal
       FROM daily_metrics WHERE isin = ? ORDER BY session_date DESC LIMIT ?`
    )
    .all(isin, limit) as {
    session_date: string;
    market_price: number;
    fair_value: number;
    discount_pct: number;
    volume: number;
    signal: string | null;
  }[];
}

export function getPositions() {
  const db = getDb();
  return db
    .prepare(
      `SELECT pl.id, pl.isin, pl.units, pl.cost_per_unit, pl.purchase_date, pl.notes,
              t.tranche_code, t.maturity_date, t.issue_price, t.coupon_pa, t.units_per_bond
       FROM position_lots pl
       JOIN tranches t ON t.isin = pl.isin
       ORDER BY pl.purchase_date`
    )
    .all() as {
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
  }[];
}

export function getActionLog(limit = 200) {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM action_log ORDER BY session_date DESC, id DESC LIMIT ?`
    )
    .all(limit) as {
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
  }[];
}

export function getAlerts(unackedOnly = false, limit = 50) {
  const db = getDb();
  if (unackedOnly) {
    return db
      .prepare(
        `SELECT * FROM alerts WHERE acknowledged = 0 ORDER BY created_at DESC LIMIT ?`
      )
      .all(limit);
  }
  return db
    .prepare(`SELECT * FROM alerts ORDER BY created_at DESC LIMIT ?`)
    .all(limit);
}

export function getActiveTranches(): Tranche[] {
  const db = getDb();
  return db
    .prepare(`SELECT * FROM tranches WHERE active = 1 ORDER BY tranche_code`)
    .all() as Tranche[];
}
