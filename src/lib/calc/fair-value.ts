/** Fair value of one SGB unit given IBJA 999 ₹/10g spot. */
export function fairValuePerUnit(
  goldRatePer10g: number,
  unitsPerBondGrams = 1
): number {
  const perGram = goldRatePer10g / 10;
  return perGram * unitsPerBondGrams;
}

/**
 * Discount/premium % = (fair value − market price) / fair value.
 * Positive = trading at a discount to fair value.
 */
export function discountPct(fairValue: number, marketPrice: number): number {
  if (fairValue <= 0) return 0;
  return ((fairValue - marketPrice) / fairValue) * 100;
}

export function yearsBetween(fromIso: string, toIso: string): number {
  const a = new Date(fromIso + "T00:00:00Z").getTime();
  const b = new Date(toIso + "T00:00:00Z").getTime();
  return Math.max(0, (b - a) / (365.25 * 24 * 3600 * 1000));
}

export function addYearsIso(iso: string, years: number): string {
  const d = new Date(iso + "T00:00:00Z");
  const ms = years * 365.25 * 24 * 3600 * 1000;
  const next = new Date(d.getTime() + ms);
  return next.toISOString().slice(0, 10);
}

export function addMonthsIso(iso: string, months: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}
