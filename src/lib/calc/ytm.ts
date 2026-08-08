/**
 * IRR / YTM via bisection on NPV of cash flows.
 * Cash flows: negative at t=0 (purchase), positive coupons + redemption.
 * Periods measured in years from settlement.
 */

export type TimedCashFlow = { tYears: number; amount: number };

export function npv(rate: number, flows: TimedCashFlow[]): number {
  let total = 0;
  for (const f of flows) {
    total += f.amount / Math.pow(1 + rate, f.tYears);
  }
  return total;
}

export function solveIrr(
  flows: TimedCashFlow[],
  low = -0.99,
  high = 5,
  tol = 1e-8,
  maxIter = 200
): number | null {
  if (flows.length < 2) return null;
  let a = low;
  let b = high;
  let fa = npv(a, flows);
  let fb = npv(b, flows);
  if (!Number.isFinite(fa) || !Number.isFinite(fb)) return null;
  if (fa * fb > 0) {
    // Expand search once
    b = 10;
    fb = npv(b, flows);
    if (fa * fb > 0) return null;
  }
  for (let i = 0; i < maxIter; i++) {
    const mid = (a + b) / 2;
    const fm = npv(mid, flows);
    if (Math.abs(fm) < tol || (b - a) / 2 < tol) return mid;
    if (fa * fm <= 0) {
      b = mid;
      fb = fm;
    } else {
      a = mid;
      fa = fm;
    }
  }
  return (a + b) / 2;
}

/**
 * Build YTM cash flows for one unit bought at marketPrice on sessionDate.
 * Semi-annual coupon = (couponPa/100)/2 * issuePrice.
 * Redemption projected from current gold fair value grown at goldCagr.
 */
export function buildYtmFlows(params: {
  marketPrice: number;
  issuePrice: number;
  couponPa: number;
  sessionDate: string;
  maturityDate: string;
  currentFairValue: number;
  goldCagr: number;
  yearsToMaturity: number;
}): TimedCashFlow[] {
  const {
    marketPrice,
    issuePrice,
    couponPa,
    sessionDate,
    maturityDate,
    currentFairValue,
    goldCagr,
    yearsToMaturity,
  } = params;

  const flows: TimedCashFlow[] = [{ tYears: 0, amount: -marketPrice }];
  const semiCoupon = (couponPa / 100 / 2) * issuePrice;
  const redemption =
    currentFairValue * Math.pow(1 + goldCagr, Math.max(0, yearsToMaturity));

  // Coupons every 6 months until maturity
  const start = new Date(sessionDate + "T00:00:00Z");
  const end = new Date(maturityDate + "T00:00:00Z");
  // Align to next semi-annual from issue-like schedule: every 0.5y from session
  let t = 0.5;
  const maturityYears = Math.max(
    0,
    (end.getTime() - start.getTime()) / (365.25 * 24 * 3600 * 1000)
  );
  while (t < maturityYears - 1e-6) {
    flows.push({ tYears: t, amount: semiCoupon });
    t += 0.5;
  }
  flows.push({ tYears: maturityYears, amount: semiCoupon + redemption });
  return flows;
}

export function ytmForCagr(params: {
  marketPrice: number;
  issuePrice: number;
  couponPa: number;
  sessionDate: string;
  maturityDate: string;
  currentFairValue: number;
  goldCagr: number;
  yearsToMaturity: number;
}): { ytm: number | null; redemption: number; flows: TimedCashFlow[] } {
  const flows = buildYtmFlows(params);
  const redemption =
    params.currentFairValue *
    Math.pow(1 + params.goldCagr, Math.max(0, params.yearsToMaturity));
  return { ytm: solveIrr(flows), redemption, flows };
}
