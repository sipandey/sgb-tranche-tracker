export const SCHEMA_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS tranches (
  isin TEXT PRIMARY KEY,
  tranche_code TEXT NOT NULL UNIQUE,
  nse_symbol TEXT,
  bse_scrip_code TEXT,
  issue_date TEXT,
  maturity_date TEXT,
  issue_price REAL,
  coupon_pa REAL NOT NULL DEFAULT 2.5,
  units_per_bond REAL NOT NULL DEFAULT 1.0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS gold_spot (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_date TEXT NOT NULL,
  rate_per_10g REAL NOT NULL,
  purity INTEGER NOT NULL DEFAULT 999,
  source TEXT NOT NULL,
  fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(session_date, source)
);

CREATE TABLE IF NOT EXISTS prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  isin TEXT NOT NULL,
  exchange TEXT NOT NULL CHECK (exchange IN ('NSE', 'BSE')),
  session_date TEXT NOT NULL,
  close REAL NOT NULL,
  volume REAL NOT NULL DEFAULT 0,
  source TEXT NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0,
  outlier INTEGER NOT NULL DEFAULT 0,
  fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(isin, exchange, session_date),
  FOREIGN KEY (isin) REFERENCES tranches(isin)
);

CREATE TABLE IF NOT EXISTS daily_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  isin TEXT NOT NULL,
  session_date TEXT NOT NULL,
  market_price REAL NOT NULL,
  fair_value REAL NOT NULL,
  discount_pct REAL NOT NULL,
  volume REAL NOT NULL DEFAULT 0,
  liquidity_ok INTEGER NOT NULL DEFAULT 0,
  price_verified INTEGER NOT NULL DEFAULT 0,
  price_outlier INTEGER NOT NULL DEFAULT 0,
  years_to_maturity REAL,
  signal TEXT,
  UNIQUE(isin, session_date),
  FOREIGN KEY (isin) REFERENCES tranches(isin)
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS position_lots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  isin TEXT NOT NULL,
  units REAL NOT NULL,
  cost_per_unit REAL NOT NULL,
  purchase_date TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (isin) REFERENCES tranches(isin)
);

CREATE TABLE IF NOT EXISTS action_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_date TEXT NOT NULL,
  isin TEXT,
  tranche_code TEXT,
  signal TEXT NOT NULL,
  discount_pct REAL,
  size_suggestion REAL,
  note TEXT,
  cumulative_units REAL,
  cumulative_capital REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  isin TEXT NOT NULL,
  tranche_code TEXT,
  session_date TEXT NOT NULL,
  threshold_pct REAL NOT NULL,
  discount_pct REAL NOT NULL,
  message TEXT NOT NULL,
  acknowledged INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS trading_calendar (
  session_date TEXT PRIMARY KEY,
  nse_ok INTEGER NOT NULL DEFAULT 0,
  bse_ok INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_prices_session ON prices(session_date);
CREATE INDEX IF NOT EXISTS idx_prices_isin ON prices(isin);
CREATE INDEX IF NOT EXISTS idx_metrics_session ON daily_metrics(session_date);
CREATE INDEX IF NOT EXISTS idx_metrics_discount ON daily_metrics(session_date, discount_pct DESC);
CREATE INDEX IF NOT EXISTS idx_action_log_session ON action_log(session_date);
CREATE INDEX IF NOT EXISTS idx_alerts_ack ON alerts(acknowledged, session_date);
`;

export const DEFAULT_SETTINGS: Record<string, string> = {
  dry_powder_inr: "500000",
  dry_powder_remaining_inr: "500000",
  cg_tax_rate_pct: "12.5",
  income_tax_slab_pct: "30",
  gold_cagr_scenarios: "[0,5,7,8,10,12]",
  switch_threshold_pct: "2.5",
  watched_isins: "[]",
  min_volume_for_large_deploy: "100",
  price_outlier_threshold_pct: "1",
  ibja_access_token: "",
  last_session_date: "",
};
