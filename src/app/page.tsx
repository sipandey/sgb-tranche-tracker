import { getSettings } from "@/lib/db";
import {
  getAlerts,
  getDiscountRanking,
  getLastSessionDate,
} from "@/lib/db/queries";
import { getLatestGold } from "@/lib/ingest/ibja";
import { seedDemoSession } from "@/lib/ingest/demo";
import { DisclaimerBanner } from "@/components/Disclaimer";
import { SessionStamp } from "@/components/SessionStamp";
import { RefreshButton } from "@/components/RefreshButton";
import { PageExplainer } from "@/components/PageExplainer";
import { ExampleWalkthrough } from "@/components/ExampleWalkthrough";
import { RankingTable } from "@/components/RankingTable";
import { LearnButton } from "@/components/LearnPanel";
import { formatInr } from "@/lib/format";
import { PAGE_WHAT_IS_THIS } from "@/lib/plain-language";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let sessionDate = await getLastSessionDate();
  let demo = false;
  if (!sessionDate) {
    const seeded = await seedDemoSession();
    sessionDate = seeded.sessionDate;
    demo = true;
  }

  const ranking = await getDiscountRanking(sessionDate);
  const settings = await getSettings();
  const gold = await getLatestGold(sessionDate);
  const alerts = (await getAlerts(true, 5)) as {
    id: number;
    tranche_code: string | null;
    message: string;
    discount_pct: number;
  }[];

  const rows = ranking.map((r) => ({
    isin: r.isin,
    tranche_code: r.tranche_code,
    signal: r.signal,
    discount_pct: Number(r.discount_pct),
    market_price: Number(r.market_price),
    fair_value: Number(r.fair_value),
    volume: Number(r.volume),
    years_to_maturity:
      r.years_to_maturity == null ? null : Number(r.years_to_maturity),
    price_verified: Number(r.price_verified),
    price_outlier: Number(r.price_outlier),
    liquidity_ok: Number(r.liquidity_ok),
  }));

  return (
    <div>
      <section className="pt-10 pb-6 sm:pt-14 sm:pb-8 animate-rise">
        <p className="text-sm tracking-[0.18em] uppercase text-[var(--gold)] mb-3">
          Gold bonds on the stock exchange
        </p>
        <h1 className="font-display text-4xl sm:text-6xl leading-[1.05] tracking-tight mb-4">
          <span className="brand-glow">SGB Tracker</span>
        </h1>
        <p className="max-w-xl text-base sm:text-lg muted mb-6">
          Find Sovereign Gold Bonds that are trading cheaper than gold — and
          skip the ones that cost more right now.
        </p>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <a href="#ranking" className="btn">
            See cheaper-than-gold bonds
          </a>
          <LearnButton />
          <RefreshButton />
        </div>
        <SessionStamp
          sessionDate={sessionDate}
          goldRate={gold?.rate_per_10g}
          goldSource={gold?.source}
          demo={demo}
        />
      </section>

      <PageExplainer>
        <p>{PAGE_WHAT_IS_THIS}</p>
        <p>
          <strong className="text-[var(--ink)] font-medium">Strong buy</strong>{" "}
          / <strong className="text-[var(--ink)] font-medium">Buy</strong> =
          trading below the gold price.{" "}
          <strong className="text-[var(--ink)] font-medium">Skip</strong> =
          costs more than gold right now.
        </p>
      </PageExplainer>

      <ExampleWalkthrough />

      <DisclaimerBanner />

      <section className="grid sm:grid-cols-3 gap-4 mb-8 animate-rise-delay">
        <div className="panel p-4">
          <div className="label">Cash set aside to invest</div>
          <div className="font-display text-2xl num text-[var(--gold-bright)]">
            ₹{formatInr(settings.dry_powder_remaining_inr, 0)}
          </div>
          <div className="text-xs muted mt-1">
            Cap ₹{formatInr(settings.dry_powder_inr, 0)} — you set this in
            Settings
          </div>
        </div>
        <div className="panel p-4">
          <div className="label">Bonds tracked today</div>
          <div className="font-display text-2xl num">{ranking.length}</div>
          <div className="text-xs muted mt-1">
            From the last trading session, not weekends
          </div>
        </div>
        <div className="panel p-4">
          <div className="label">Your assumptions</div>
          <div className="text-sm mt-1">
            Capital gains tax{" "}
            <span className="num">{settings.cg_tax_rate_pct}%</span>
            <span className="muted"> · </span>
            Switch only if gap ≥{" "}
            <span className="num">{settings.switch_threshold_pct}%</span>
          </div>
          <div className="text-xs muted mt-1">
            Gold growth scenarios you chose:{" "}
            {settings.gold_cagr_scenarios.join("% / ")}%
          </div>
        </div>
      </section>

      {alerts.length > 0 && (
        <section className="mb-8 panel p-4">
          <h2 className="font-display text-xl mb-3">Heads-up</h2>
          <ul className="space-y-2 text-sm">
            {alerts.map((a) => (
              <li key={a.id} className="flex justify-between gap-4">
                <span>{a.message}</span>
                <span className="num text-[var(--buy)] shrink-0">
                  {Number(a.discount_pct).toFixed(2)}% cheaper
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <RankingTable rows={rows} />
    </div>
  );
}
