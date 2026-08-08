export type Tranche = {
  isin: string;
  tranche_code: string;
  nse_symbol: string | null;
  bse_scrip_code: string | null;
  issue_date: string | null;
  maturity_date: string | null;
  issue_price: number | null;
  coupon_pa: number;
  units_per_bond: number;
  active: number;
};

export type DailyMetricRow = {
  isin: string;
  tranche_code: string;
  session_date: string;
  market_price: number;
  fair_value: number;
  discount_pct: number;
  volume: number;
  liquidity_ok: number;
  price_verified: number;
  price_outlier: number;
  years_to_maturity: number | null;
  signal: string | null;
  issue_date: string | null;
  maturity_date: string | null;
  issue_price: number | null;
  coupon_pa: number;
  nse_symbol: string | null;
};

export type Signal =
  | "strong_buy"
  | "buy"
  | "trickle"
  | "skip"
  | "hold"
  | "switch";

export type CashFlow = {
  date: string;
  amount: number;
  label?: string;
};

export type AppSettings = {
  dry_powder_inr: number;
  dry_powder_remaining_inr: number;
  cg_tax_rate_pct: number;
  income_tax_slab_pct: number;
  gold_cagr_scenarios: number[];
  switch_threshold_pct: number;
  watched_isins: string[];
  min_volume_for_large_deploy: number;
  price_outlier_threshold_pct: number;
  ibja_access_token: string;
  last_session_date: string;
};
