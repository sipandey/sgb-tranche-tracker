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
import { DiscountLabel, SaleBadge } from "@/components/DiscountLabel";
import { TrustBadge } from "@/components/TrustBadge";
import { YearsLeft } from "@/components/YearsLeft";
import { CoinStack } from "@/components/CoinStack";
import { SafetyNote } from "@/components/SafetyNote";
import { WhatIsThis } from "@/components/Tip";
import { batchDisplayName } from "@/lib/plain-language";
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

  const disc = metrics ? Number(metrics.discount_pct) : 0;

  return (
    <div className="pt-8">
      <Link href="/#ranking" className="text-sm muted hover:text-[var(--ink)]">
        ← Back to the shelf
      </Link>
      <header className="mt-4 mb-5 animate-rise flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs muted mb-1">Gold coupon batch</p>
          <h1 className="font-display text-3xl sm:text-4xl tracking-tight mb-1">
            {batchDisplayName(tranche.tranche_code)}
          </h1>
          <p className="muted text-sm num mb-3">{tranche.tranche_code} · {tranche.isin}</p>
          <SessionStamp
            sessionDate={sessionDate}
            goldRate={gold?.rate_per_10g}
            goldSource={gold?.source}
          />
        </div>
        {metrics && <CoinStack discountPct={disc} size="lg" />}
      </header>

      <p className="text-sm muted mb-5 max-w-2xl leading-relaxed">
        This page is one batch of gold-bond coupons. See if it’s on sale versus
        real gold, how long the piggy bank is locked, and what yearly returns
        look like under gold-growth guesses <em>you</em> pick.
        <WhatIsThis title="Why “batch”?">
          Each SGB series is a batch sold around the same time. People nickname
          them by month and year — like “the Feb 2033 batch.”
        </WhatIsThis>
      </p>

      <SafetyNote className="mb-5" />
      <DisclaimerBanner />

      {metrics && (
        <section className="grid sm:grid-cols-2 gap-3 mb-8">
          <div className="panel p-4 flex items-center gap-4">
            <SaleBadge discountPct={disc} />
            <div>
              <div className="label">Shelf price</div>
              <div className="font-display text-2xl num">
                ₹{formatInr(Number(metrics.market_price))}
              </div>
              <div className="text-xs muted mt-1">
                Gold-linked value ₹{formatInr(Number(metrics.fair_value))}
              </div>
            </div>
          </div>
          <div className="panel p-4">
            <div className="label">Deal vibe</div>
            <div className="mt-1">
              <SignalBadge signal={metrics.signal} showExplain large />
            </div>
            <div className="text-sm muted mt-3">
              <YearsLeft years={metrics.years_to_maturity} />
            </div>
          </div>
        </section>
      )}

      <section className="panel p-4 mb-8 grid sm:grid-cols-2 gap-4 text-sm">
        <div>
          <div className="label">When this batch was born</div>
          <p>
            {tranche.issue_date ?? "—"} · first price ₹
            {formatInr(tranche.issue_price)} · RBI’s little yearly bonus{" "}
            {tranche.coupon_pa}% (like savings interest)
            <WhatIsThis title="Yearly bonus?">
              RBI pays a fixed 2.5% a year for holding the bond — think of it as
              a small thank-you while you wait, separate from gold’s price moves.
            </WhatIsThis>
          </p>
        </div>
        <div>
          <div className="label">Payout day</div>
          <p>
            {tranche.maturity_date ?? "—"} · {tranche.units_per_bond}g of gold
            per unit
          </p>
        </div>
        <div className="sm:col-span-2">
          <div className="label">Should I trust this price?</div>
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
            If gold grows… what’s my yearly vibe?
          </h2>
          <p className="text-xs muted mt-1">
            These are storylines using your assumed gold growth — not promises.
            “Yearly return” folds in price and the bonus. “After tax” uses your
            capital-gains rate on the gain only.
            <WhatIsThis title="Why so many percentages?">
              Nobody knows tomorrow’s gold price. We show a few “what if gold
              grows X% a year?” stories so you can compare calmly.
            </WhatIsThis>
          </p>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>If gold grows</th>
                <th>Yearly return (before tax)</th>
                <th>Projected payout</th>
                <th>After tax on the gain</th>
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
          Tweak growth guesses and tax in{" "}
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
                <th>Day</th>
                <th>Price</th>
                <th>Gold-linked</th>
                <th>Sale?</th>
                <th>Activity</th>
                <th>Vibe</th>
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
