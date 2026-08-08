import Link from "next/link";
import { notFound } from "next/navigation";
import { getSettings } from "@/lib/db";
import {
  getLastSessionDate,
  getMetricsHistory,
  getTrancheByCode,
  getTrancheMetrics,
} from "@/lib/db/queries";
import { getLatestGold } from "@/lib/ingest/ibja";
import { ytmForCagr, netRedemptionAfterCgTax } from "@/lib/calc";
import { DisclaimerBanner } from "@/components/Disclaimer";
import { SessionStamp } from "@/components/SessionStamp";
import { SignalBadge } from "@/components/SignalBadge";
import { DiscountLabel } from "@/components/DiscountLabel";
import { TrustBadge } from "@/components/TrustBadge";
import { YearsLeft } from "@/components/YearsLeft";
import { PageExplainer } from "@/components/PageExplainer";
import { formatInr, formatPct } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TrancheDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const tranche = await getTrancheByCode(decodeURIComponent(code));
  if (!tranche) notFound();

  const sessionDate = await getLastSessionDate();
  if (!sessionDate) notFound();

  const metrics = await getTrancheMetrics(tranche.isin, sessionDate);
  const settings = await getSettings();
  const gold = await getLatestGold(sessionDate);
  const history = await getMetricsHistory(tranche.isin, 30);

  const scenarios = settings.gold_cagr_scenarios.map((cagrPct) => {
    if (!metrics || !tranche.maturity_date || !tranche.issue_price) {
      return { cagrPct, ytm: null, redemption: null, postTax: null };
    }
    const years = Number(metrics.years_to_maturity ?? 0);
    const result = ytmForCagr({
      marketPrice: Number(metrics.market_price),
      issuePrice: Number(tranche.issue_price),
      couponPa: Number(tranche.coupon_pa),
      sessionDate,
      maturityDate: tranche.maturity_date,
      currentFairValue: Number(metrics.fair_value),
      goldCagr: cagrPct / 100,
      yearsToMaturity: years,
    });
    const postTax = netRedemptionAfterCgTax(
      Number(metrics.market_price),
      result.redemption,
      settings.cg_tax_rate_pct
    );
    return {
      cagrPct,
      ytm: result.ytm,
      redemption: result.redemption,
      postTax,
    };
  });

  return (
    <div className="pt-8">
      <Link href="/#ranking" className="text-sm muted hover:text-[var(--ink)]">
        ← Back to bonds list
      </Link>
      <header className="mt-4 mb-6 animate-rise">
        <h1 className="font-display text-4xl tracking-tight mb-2">
          {tranche.tranche_code}
        </h1>
        <p className="muted text-sm num mb-3">{tranche.isin}</p>
        <SessionStamp
          sessionDate={sessionDate}
          goldRate={gold?.rate_per_10g}
          goldSource={gold?.source}
        />
      </header>

      <PageExplainer title="What is this bond page?">
        <p>
          This is one Sovereign Gold Bond series on the exchange. Compare its
          market price to the actual gold price, see how long until it pays out,
          and explore yearly-return scenarios under gold-growth assumptions{" "}
          <em>you</em> choose.
        </p>
      </PageExplainer>

      <DisclaimerBanner />

      {metrics && (
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <Stat
            label="Market price"
            value={`₹${formatInr(Number(metrics.market_price))}`}
          />
          <Stat
            label="Gold-linked value"
            hint="fair value"
            value={`₹${formatInr(Number(metrics.fair_value))}`}
          />
          <div className="panel p-4">
            <div className="label">vs gold price</div>
            <div className="mt-1 text-sm">
              <DiscountLabel discountPct={Number(metrics.discount_pct)} />
            </div>
          </div>
          <div className="panel p-4">
            <div className="label">Signal</div>
            <div className="mt-1">
              <SignalBadge signal={metrics.signal} showExplain />
            </div>
            <div className="text-xs muted mt-2">
              <YearsLeft years={metrics.years_to_maturity} />
            </div>
          </div>
        </section>
      )}

      <section className="panel p-4 mb-8 grid sm:grid-cols-2 gap-4 text-sm">
        <div>
          <div className="label">When it was issued</div>
          <p>
            {tranche.issue_date ?? "—"} · original issue price ₹
            {formatInr(tranche.issue_price)} · fixed{" "}
            {tranche.coupon_pa}% yearly interest RBI pays (coupon)
          </p>
        </div>
        <div>
          <div className="label">When it pays out</div>
          <p>
            {tranche.maturity_date ?? "—"} · {tranche.units_per_bond}g of gold
            per unit
          </p>
        </div>
        <div className="sm:col-span-2">
          <div className="label">Price confidence</div>
          {metrics ? (
            <TrustBadge
              verified={metrics.price_verified}
              outlier={metrics.price_outlier}
              thin={!metrics.liquidity_ok}
            />
          ) : (
            <span className="muted">—</span>
          )}
        </div>
      </section>

      <section className="panel mb-8">
        <div className="px-4 pt-4 pb-2">
          <h2 className="font-display text-2xl">
            Yearly return if gold grows at…
          </h2>
          <p className="text-xs muted mt-1">
            These are scenarios using <em>your</em> assumed gold growth rates —
            not forecasts. “Yearly return” here is the internal rate of return
            before tax. “After tax” applies your capital-gains rate to the gain
            portion only (secondary-market purchase).
          </p>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>If gold grows</th>
                <th>Yearly return (before tax)</th>
                <th>Projected payout</th>
                <th>After capital-gains tax</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((s) => (
                <tr key={s.cagrPct}>
                  <td className="num">{s.cagrPct}% / year</td>
                  <td className="num">
                    {s.ytm == null ? "—" : formatPct(s.ytm * 100)}
                  </td>
                  <td className="num">₹{formatInr(s.redemption)}</td>
                  <td className="num">₹{formatInr(s.postTax)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="px-4 py-3 text-xs muted">
          Change growth scenarios and tax rates in{" "}
          <Link href="/settings" className="text-[var(--gold-bright)]">
            Settings
          </Link>
          .
        </p>
      </section>

      <section className="panel">
        <div className="px-4 pt-4 pb-2">
          <h2 className="font-display text-2xl">Recent trading days</h2>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Trading day</th>
                <th>Price</th>
                <th>Gold-linked value</th>
                <th>vs gold</th>
                <th>Activity</th>
                <th>Signal</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.session_date}>
                  <td className="num">{h.session_date}</td>
                  <td className="num">₹{formatInr(Number(h.market_price))}</td>
                  <td className="num">₹{formatInr(Number(h.fair_value))}</td>
                  <td>
                    <DiscountLabel
                      discountPct={Number(h.discount_pct)}
                      compact
                    />
                  </td>
                  <td className="num">{formatInr(Number(h.volume), 0)}</td>
                  <td>
                    <SignalBadge signal={h.signal} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "buy" | "skip";
}) {
  const color =
    accent === "buy"
      ? "text-[var(--buy)]"
      : accent === "skip"
        ? "text-[var(--skip)]"
        : "text-[var(--ink)]";
  return (
    <div className="panel p-4">
      <div className="label">
        {label}
        {hint ? ` (${hint})` : ""}
      </div>
      <div className={`font-display text-xl num ${color}`}>{value}</div>
    </div>
  );
}
