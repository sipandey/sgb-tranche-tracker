import {
  discountPct,
  fairValuePerUnit,
  solveIrr,
  ytmForCagr,
  xirr,
  netRedemptionAfterCgTax,
} from "../src/lib/calc";
import { signalFromDiscount, sizeSuggestion, shouldSwitch } from "../src/lib/rules/engine";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

// Fair value: ₹149020 / 10g → ₹14902 / g
const fv = fairValuePerUnit(149020, 1);
assert(Math.abs(fv - 14902) < 0.01, `fv=${fv}`);

const disc = discountPct(14902, 14000);
assert(disc > 5 && disc < 7, `disc=${disc}`);

assert(signalFromDiscount(6) === "strong_buy", "strong_buy");
assert(signalFromDiscount(4) === "buy", "buy");
assert(signalFromDiscount(1) === "trickle", "trickle");
assert(signalFromDiscount(-1) === "skip", "skip");

const size = sizeSuggestion({
  discountPct: 6,
  dryPowderRemaining: 100000,
  volume: 200,
  minVolume: 100,
});
assert(size.amount === 45000, `size=${size.amount}`);

assert(
  shouldSwitch({
    heldDiscountPct: 1,
    candidateDiscountPct: 5,
    switchThresholdPct: 2.5,
  }),
  "should switch"
);

const irr = solveIrr([
  { tYears: 0, amount: -100 },
  { tYears: 1, amount: 110 },
]);
assert(irr != null && Math.abs(irr - 0.1) < 1e-6, `irr=${irr}`);

const ytm = ytmForCagr({
  marketPrice: 14000,
  issuePrice: 5000,
  couponPa: 2.5,
  sessionDate: "2026-08-07",
  maturityDate: "2031-08-07",
  currentFairValue: 14902,
  goldCagr: 0.08,
  yearsToMaturity: 5,
});
assert(ytm.ytm != null && ytm.ytm > 0, `ytm=${ytm.ytm}`);

const xi = xirr([
  { date: "2024-01-01", amount: -10000 },
  { date: "2025-01-01", amount: 11000 },
]);
assert(xi != null && xi > 0.09 && xi < 0.11, `xirr=${xi}`);

const net = netRedemptionAfterCgTax(10000, 20000, 12.5);
assert(Math.abs(net - 18750) < 0.01, `net=${net}`);

console.log("All calc/rules tests passed");
