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
import { formatInr, formatPct, formatYears } from "@/lib/format";

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
        ← Ranking
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

      <DisclaimerBanner />

      {metrics && (
        <section className="grid sm:grid-cols-4 gap-3 mb-8">
          <Stat label="Market" value={`₹${formatInr(metrics.market_price)}`} />
          <Stat label="Fair value" value={`₹${formatInr(metrics.fair_value)}`} />
          <Stat
            label="Discount"
            value={formatPct(metrics.discount_pct)}
            accent={metrics.discount_pct >= 0 ? "buy" : "skip"}
          />
          <div className="panel p-4">
            <div className="label">Signal</div>
            <div className="mt-1">
              <SignalBadge signal={metrics.signal} />
            </div>
            <div className="text-xs muted mt-2">
              {formatYears(metrics.years_to_maturity)} to maturity
            </div>
          </div>
        </section>
      )}

      <section className="panel p-4 mb-8 grid sm:grid-cols-2 gap-4 text-sm">
        <div>
          <div className="label">Issue</div>
          <p>
            {tranche.issue_date ?? "—"} · issue price ₹
            {formatInr(tranche.issue_price)} · coupon {tranche.coupon_pa}% p.a.
          </p>
        </div>
        <div>
          <div className="label">Maturity</div>
          <p>
            {tranche.maturity_date ?? "—"} · {tranche.units_per_bond}g / unit
          </p>
        </div>
        <div className="sm:col-span-2 text-xs muted">
          Flags:{" "}
          {metrics?.price_verified ? "verified dual-source" : "unverified single source"}
          {metrics?.price_outlier ? " · exchange outlier flagged" : ""}
          {metrics && !metrics.liquidity_ok ? " · thin volume" : ""}
        </div>
      </section>

      <section className="panel mb-8">
        <div className="px-4 pt-4 pb-2">
          <h2 className="font-display text-2xl">YTM scenarios</h2>
          <p className="text-xs muted mt-1">
            Gold CAGR assumptions are your inputs. Redemption projected from
            current fair value. Post-tax applies your CG rate to the gain portion
            only (secondary purchase).
          </p>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Gold CAGR</th>
                <th>YTM (pre-tax)</th>
                <th>Proj. redemption</th>
                <th>After CG tax</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((s) => (
                <tr key={s.cagrPct}>
                  <td className="num">{s.cagrPct}%</td>
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
          Adjust CAGR list and tax rates in{" "}
          <Link href="/settings" className="text-[var(--gold-bright)]">
            Settings
          </Link>
          .
        </p>
      </section>

      <section className="panel">
        <div className="px-4 pt-4 pb-2">
          <h2 className="font-display text-2xl">Recent sessions</h2>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Session</th>
                <th>Price</th>
                <th>Fair value</th>
                <th>Discount</th>
                <th>Volume</th>
                <th>Signal</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.session_date}>
                  <td className="num">{h.session_date}</td>
                  <td className="num">₹{formatInr(h.market_price)}</td>
                  <td className="num">₹{formatInr(h.fair_value)}</td>
                  <td className="num">{formatPct(h.discount_pct)}</td>
                  <td className="num">{formatInr(h.volume, 0)}</td>
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
  accent,
}: {
  label: string;
  value: string;
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
      <div className="label">{label}</div>
      <div className={`font-display text-xl num ${color}`}>{value}</div>
    </div>
  );
}
