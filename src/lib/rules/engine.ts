import type { Signal } from "@/lib/db/types";

export function signalFromDiscount(discountPct: number): Signal {
  if (discountPct >= 5) return "strong_buy";
  if (discountPct >= 3) return "buy";
  if (discountPct >= 0) return "trickle";
  return "skip";
}

/**
 * Opportunistic sizing against remaining dry powder.
 * 3–5% → ~22%, 5–7% → ~45%, >7% → up to 75%.
 * Thin books (volume < minVolume) get capped.
 */
export function sizeSuggestion(params: {
  discountPct: number;
  dryPowderRemaining: number;
  volume: number;
  minVolume: number;
}): { amount: number; liquidityWarning: boolean; deployPct: number } {
  const { discountPct, dryPowderRemaining, volume, minVolume } = params;
  let deployPct = 0;
  if (discountPct >= 7) deployPct = 0.75;
  else if (discountPct >= 5) deployPct = 0.45;
  else if (discountPct >= 3) deployPct = 0.22;
  else if (discountPct >= 0) deployPct = 0.05;
  else deployPct = 0;

  let amount = dryPowderRemaining * deployPct;
  let liquidityWarning = false;
  if (deployPct >= 0.4 && volume < minVolume) {
    amount = Math.min(amount, dryPowderRemaining * 0.1);
    liquidityWarning = true;
  }
  return { amount: Math.round(amount), liquidityWarning, deployPct };
}

export type RankedTranche = {
  isin: string;
  tranche_code: string;
  discount_pct: number;
  volume: number;
  maturity_date: string | null;
  liquidity_ok: number;
  price_verified: number;
  signal: Signal;
};

/**
 * Diversify suggested buys across 3–5 staggered-maturity tranches.
 * Never concentrate large size in one thin book.
 */
export function diversifySuggestions(
  ranked: RankedTranche[],
  dryPowderRemaining: number,
  minVolume: number,
  maxTranches = 5
): {
  isin: string;
  tranche_code: string;
  signal: Signal;
  amount: number;
  note: string;
}[] {
  const buys = ranked
    .filter((t) => t.discount_pct >= 0 && t.signal !== "skip")
    .slice(0, 20);

  // Prefer staggered maturities: sort by discount then pick distinct maturity years
  const picked: RankedTranche[] = [];
  const yearsUsed = new Set<string>();
  for (const t of buys) {
    const year = (t.maturity_date ?? "").slice(0, 4);
    if (picked.length >= maxTranches) break;
    if (year && yearsUsed.has(year) && picked.length >= 3) continue;
    if (year) yearsUsed.add(year);
    picked.push(t);
  }

  // Ensure at least 3 if available
  for (const t of buys) {
    if (picked.length >= 3) break;
    if (!picked.find((p) => p.isin === t.isin)) picked.push(t);
  }

  const perTranchePowder = dryPowderRemaining / Math.max(1, picked.length);
  return picked.map((t) => {
    const sizing = sizeSuggestion({
      discountPct: t.discount_pct,
      dryPowderRemaining: perTranchePowder,
      volume: t.volume,
      minVolume,
    });
    const notes: string[] = [];
    if (sizing.liquidityWarning) {
      notes.push("liquidity capped — thin order book");
    }
    if (!t.price_verified) notes.push("price unverified (single source)");
    return {
      isin: t.isin,
      tranche_code: t.tranche_code,
      signal: t.signal,
      amount: sizing.amount,
      note: notes.join("; "),
    };
  });
}

/**
 * Switch only when after-tax/after-cost discount gap exceeds threshold.
 * Default posture: hold to maturity.
 */
export function shouldSwitch(params: {
  heldDiscountPct: number;
  candidateDiscountPct: number;
  switchThresholdPct: number;
  estimatedSwitchCostPct?: number;
}): boolean {
  const cost = params.estimatedSwitchCostPct ?? 0.3;
  const gap =
    params.candidateDiscountPct - params.heldDiscountPct - cost;
  return gap >= params.switchThresholdPct;
}
