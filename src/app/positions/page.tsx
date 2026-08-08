import Link from "next/link";
import { getSettings } from "@/lib/db";
import { getLastSessionDate, getPositions, getTrancheMetrics } from "@/lib/db/queries";
import { getLatestGold } from "@/lib/ingest/ibja";
import {
  buildPositionCashFlows,
  fairValuePerUnit,
  netRedemptionAfterCgTax,
  xirr,
  ytmForCagr,
} from "@/lib/calc";
import { DisclaimerBanner } from "@/components/Disclaimer";
import { SessionStamp } from "@/components/SessionStamp";
import { formatInr, formatPct } from "@/lib/format";
import { PositionForm } from "@/components/PositionForm";

export const dynamic = "force-dynamic";

export default function PositionsPage() {
  const lots = getPositions();
  const sessionDate = getLastSessionDate();
  const settings = getSettings();
  const gold = sessionDate ? getLatestGold(sessionDate) : null;

  // Aggregate by ISIN
  const byIsin = new Map<
    string,
    {
      isin: string;
      tranche_code: string;
      units: number;
      cost: number;
      maturity_date: string | null;
      issue_price: number | null;
      coupon_pa: number;
      units_per_bond: number;
      lots: typeof lots;
    }
  >();

  for (const lot of lots) {
    const cur = byIsin.get(lot.isin) ?? {
      isin: lot.isin,
      tranche_code: lot.tranche_code,
      units: 0,
      cost: 0,
      maturity_date: lot.maturity_date,
      issue_price: lot.issue_price,
      coupon_pa: lot.coupon_pa,
      units_per_bond: lot.units_per_bond,
      lots: [] as typeof lots,
    };
    cur.units += lot.units;
    cur.cost += lot.units * lot.cost_per_unit;
    cur.lots.push(lot);
    byIsin.set(lot.isin, cur);
  }

  const rows = [...byIsin.values()].map((p) => {
    const metrics =
      sessionDate != null ? getTrancheMetrics(p.isin, sessionDate) : null;
    const market = metrics?.market_price ?? null;
    const fv =
      metrics?.fair_value ??
      (gold ? fairValuePerUnit(gold.rate_per_10g, p.units_per_bond) : null);
    const avgCost = p.units > 0 ? p.cost / p.units : 0;
    const mktValue = market != null ? market * p.units : null;
    const fvValue = fv != null ? fv * p.units : null;
    const uPnLMkt = mktValue != null ? mktValue - p.cost : null;
    const uPnLFv = fvValue != null ? fvValue - p.cost : null;

    const cagr = settings.gold_cagr_scenarios.includes(8)
      ? 8
      : settings.gold_cagr_scenarios[0] ?? 0;
    let projectedRedemption: number | null = null;
    let xirrPre: number | null = null;
    let xirrPost: number | null = null;
    if (
      sessionDate &&
      metrics &&
      p.maturity_date &&
      p.issue_price != null
    ) {
      const y = ytmForCagr({
        marketPrice: avgCost,
        issuePrice: p.issue_price,
        couponPa: p.coupon_pa,
        sessionDate,
        maturityDate: p.maturity_date,
        currentFairValue: metrics.fair_value,
        goldCagr: cagr / 100,
        yearsToMaturity: metrics.years_to_maturity ?? 0,
      });
      projectedRedemption = y.redemption * p.units;
      const flows = buildPositionCashFlows({
        lots: p.lots.map((l) => ({
          units: l.units,
          cost_per_unit: l.cost_per_unit,
          purchase_date: l.purchase_date,
        })),
        issuePrice: p.issue_price,
        couponPa: p.coupon_pa,
        maturityDate: p.maturity_date,
        projectedRedemptionPerUnit: y.redemption,
        cgTaxRatePct: settings.cg_tax_rate_pct,
        asOfDate: sessionDate,
      });
      xirrPre = xirr(flows.preTax);
      xirrPost = xirr(flows.postTax);
    }

    const netRed =
      projectedRedemption != null
        ? netRedemptionAfterCgTax(p.cost, projectedRedemption, settings.cg_tax_rate_pct)
        : null;

    return {
      ...p,
      avgCost,
      market,
      fv,
      mktValue,
      fvValue,
      uPnLMkt,
      uPnLFv,
      projectedRedemption,
      netRed,
      xirrPre,
      xirrPost,
      cagr,
    };
  });

  return (
    <div className="pt-8">
      <h1 className="font-display text-4xl tracking-tight mb-2">Positions</h1>
      <p className="muted mb-4 max-w-2xl">
        Track lots per tranche with cost basis, unrealized P/L, and projected
        redemption under your gold CAGR assumption ({rows[0]?.cagr ?? 8}% shown).
      </p>
      <SessionStamp
        sessionDate={sessionDate}
        goldRate={gold?.rate_per_10g}
        goldSource={gold?.source}
      />
      <div className="mt-4">
        <DisclaimerBanner />
      </div>

      <PositionForm />

      <section className="panel mt-8">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Tranche</th>
                <th>Units</th>
                <th>Avg cost</th>
                <th>Mkt value</th>
                <th>U. P/L (mkt)</th>
                <th>U. P/L (FV)</th>
                <th>Proj. redeem</th>
                <th>After CG</th>
                <th>XIRR pre/post</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.isin}>
                  <td>
                    <Link
                      href={`/tranches/${encodeURIComponent(r.tranche_code)}`}
                      className="text-[var(--gold-bright)] hover:underline"
                    >
                      {r.tranche_code}
                    </Link>
                  </td>
                  <td className="num">{formatInr(r.units, 0)}</td>
                  <td className="num">₹{formatInr(r.avgCost)}</td>
                  <td className="num">₹{formatInr(r.mktValue)}</td>
                  <td
                    className={`num ${
                      (r.uPnLMkt ?? 0) >= 0
                        ? "text-[var(--buy)]"
                        : "text-[var(--skip)]"
                    }`}
                  >
                    ₹{formatInr(r.uPnLMkt)}
                  </td>
                  <td className="num">₹{formatInr(r.uPnLFv)}</td>
                  <td className="num">₹{formatInr(r.projectedRedemption)}</td>
                  <td className="num">₹{formatInr(r.netRed)}</td>
                  <td className="num text-xs">
                    {r.xirrPre == null ? "—" : formatPct(r.xirrPre * 100)}
                    {" / "}
                    {r.xirrPost == null ? "—" : formatPct(r.xirrPost * 100)}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="muted text-center py-8">
                    No lots yet — add a purchase above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {lots.length > 0 && (
        <section className="panel mt-6">
          <div className="px-4 pt-4 pb-2">
            <h2 className="font-display text-xl">Lots</h2>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Tranche</th>
                  <th>Units</th>
                  <th>Cost/unit</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {lots.map((l) => (
                  <tr key={l.id}>
                    <td className="num">{l.purchase_date}</td>
                    <td>{l.tranche_code}</td>
                    <td className="num">{formatInr(l.units, 0)}</td>
                    <td className="num">₹{formatInr(l.cost_per_unit)}</td>
                    <td className="muted text-xs">{l.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
