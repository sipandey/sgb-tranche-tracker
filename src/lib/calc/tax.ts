/**
 * Post-tax helpers for secondary-market SGB purchases.
 *
 * From 1 April 2026 (Budget 2026): capital gains exemption on maturity
 * applies only to original subscribers who held continuously. Secondary
 * purchases are taxed on the gain portion. Coupons remain income-taxed.
 *
 * These helpers never hardcode rates as facts — callers pass user inputs.
 */

export function capitalGainOnRedemption(
  costBasis: number,
  redemptionValue: number
): number {
  return Math.max(0, redemptionValue - costBasis);
}

export function cgTaxOnGain(gain: number, cgTaxRatePct: number): number {
  return gain * (cgTaxRatePct / 100);
}

export function netRedemptionAfterCgTax(
  costBasis: number,
  redemptionValue: number,
  cgTaxRatePct: number
): number {
  const gain = capitalGainOnRedemption(costBasis, redemptionValue);
  return redemptionValue - cgTaxOnGain(gain, cgTaxRatePct);
}

export function couponIncomeTax(
  couponAmount: number,
  incomeTaxSlabPct: number
): number {
  return couponAmount * (incomeTaxSlabPct / 100);
}

export const TAX_DISCLAIMER =
  "Not investment advice. Gold CAGR and tax rates are your inputs, not recommendations. From 1 Apr 2026, secondary-market SGB purchases lose the original-subscriber capital gains exemption on maturity; CG tax applies to the gain portion only. Coupons are taxed as income.";
