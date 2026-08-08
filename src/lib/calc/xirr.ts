import type { CashFlow } from "@/lib/db/types";
import { solveIrr, type TimedCashFlow } from "./ytm";

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00Z").getTime();
  const db = new Date(b + "T00:00:00Z").getTime();
  return (db - da) / (24 * 3600 * 1000);
}

/**
 * XIRR on dated cash flows (Excel-compatible annual rate).
 * Uses year-fraction from first flow date.
 */
export function xirr(flows: CashFlow[]): number | null {
  if (flows.length < 2) return null;
  const sorted = [...flows].sort((a, b) => a.date.localeCompare(b.date));
  const origin = sorted[0].date;
  const timed: TimedCashFlow[] = sorted.map((f) => ({
    tYears: daysBetween(origin, f.date) / 365.25,
    amount: f.amount,
  }));
  return solveIrr(timed);
}

export function buildPositionCashFlows(params: {
  lots: { units: number; cost_per_unit: number; purchase_date: string }[];
  issuePrice: number;
  couponPa: number;
  maturityDate: string;
  projectedRedemptionPerUnit: number;
  /** Apply CG tax on gain at redemption (secondary purchase). */
  cgTaxRatePct: number;
  asOfDate: string;
}): { preTax: CashFlow[]; postTax: CashFlow[] } {
  const {
    lots,
    issuePrice,
    couponPa,
    maturityDate,
    projectedRedemptionPerUnit,
    cgTaxRatePct,
    asOfDate,
  } = params;

  const totalUnits = lots.reduce((s, l) => s + l.units, 0);
  if (totalUnits <= 0) return { preTax: [], postTax: [] };

  const costBasis = lots.reduce((s, l) => s + l.units * l.cost_per_unit, 0);
  const preTax: CashFlow[] = [];
  for (const lot of lots) {
    preTax.push({
      date: lot.purchase_date,
      amount: -(lot.units * lot.cost_per_unit),
      label: "purchase",
    });
  }

  const semiCouponPerUnit = (couponPa / 100 / 2) * issuePrice;
  // Generate remaining coupon dates from asOf to maturity (approx every 6m)
  const start = new Date(asOfDate + "T00:00:00Z");
  const end = new Date(maturityDate + "T00:00:00Z");
  const cursor = new Date(start);
  cursor.setUTCMonth(cursor.getUTCMonth() + 6);
  while (cursor.getTime() < end.getTime() - 1) {
    const iso = cursor.toISOString().slice(0, 10);
    preTax.push({
      date: iso,
      amount: semiCouponPerUnit * totalUnits,
      label: "coupon",
    });
    cursor.setUTCMonth(cursor.getUTCMonth() + 6);
  }

  const redemptionGross = projectedRedemptionPerUnit * totalUnits;
  preTax.push({
    date: maturityDate,
    amount: semiCouponPerUnit * totalUnits + redemptionGross,
    label: "redemption+coupon",
  });

  const gain = Math.max(0, redemptionGross - costBasis);
  const tax = gain * (cgTaxRatePct / 100);
  const postTax = preTax.map((f) => {
    if (f.label === "redemption+coupon") {
      return {
        ...f,
        amount: semiCouponPerUnit * totalUnits + (redemptionGross - tax),
        label: "redemption+coupon_after_cg_tax",
      };
    }
    return { ...f };
  });

  return { preTax, postTax };
}
