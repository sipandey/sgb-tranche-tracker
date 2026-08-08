import Link from "next/link";
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
import { SignalBadge } from "@/components/SignalBadge";
import { formatInr, formatPct, formatYears } from "@/lib/format";
import { RefreshButton } from "@/components/RefreshButton";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  let sessionDate = getLastSessionDate();
  let demo = false;
  if (!sessionDate) {
    const seeded = seedDemoSession();
    sessionDate = seeded.sessionDate;
    demo = true;
  }

  const ranking = getDiscountRanking(sessionDate);
  const settings = getSettings();
  const gold = getLatestGold(sessionDate);
  const alerts = getAlerts(true, 8) as {
    id: number;
    tranche_code: string | null;
    message: string;
    discount_pct: number;
  }[];

  return (
    <div>
      <section className="pt-10 pb-8 sm:pt-16 sm:pb-12 animate-rise">
        <p className="text-sm tracking-[0.18em] uppercase text-[var(--gold)] mb-3">
          Secondary market
        </p>
        <h1 className="font-display text-4xl sm:text-6xl leading-[1.05] tracking-tight mb-4">
          <span className="brand-glow">SGB Tracker</span>
        </h1>
        <p className="max-w-xl text-base sm:text-lg muted mb-6">
          Discount to IBJA fair value across actively traded Sovereign Gold Bond
          tranches — with rules-based buy, hold, and switch signals.
        </p>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <a href="#ranking" className="btn">
            View discount ranking
          </a>
          <RefreshButton />
        </div>
        <SessionStamp
          sessionDate={sessionDate}
          goldRate={gold?.rate_per_10g}
          goldSource={gold?.source}
          demo={demo}
        />
      </section>

      <DisclaimerBanner />

      <section className="grid sm:grid-cols-3 gap-4 mb-8 animate-rise-delay">
        <div className="panel p-4">
          <div className="label">Dry powder remaining</div>
          <div className="font-display text-2xl num text-[var(--gold-bright)]">
            ₹{formatInr(settings.dry_powder_remaining_inr, 0)}
          </div>
          <div className="text-xs muted mt-1">
            Cap ₹{formatInr(settings.dry_powder_inr, 0)} · your input
          </div>
        </div>
        <div className="panel p-4">
          <div className="label">Active tranches</div>
          <div className="font-display text-2xl num">{ranking.length}</div>
          <div className="text-xs muted mt-1">Priced for this session</div>
        </div>
        <div className="panel p-4">
          <div className="label">Your assumptions</div>
          <div className="text-sm mt-1">
            CG tax <span className="num">{settings.cg_tax_rate_pct}%</span>
            <span className="muted"> · </span>
            Switch ≥{" "}
            <span className="num">{settings.switch_threshold_pct}%</span>
          </div>
          <div className="text-xs muted mt-1">
            CAGR scenarios: {settings.gold_cagr_scenarios.join("% / ")}%
          </div>
        </div>
      </section>

      {alerts.length > 0 && (
        <section className="mb-8 panel p-4">
          <h2 className="font-display text-xl mb-3">Alerts</h2>
          <ul className="space-y-2 text-sm">
            {alerts.map((a) => (
              <li key={a.id} className="flex justify-between gap-4">
                <span>{a.message}</span>
                <span className="num text-[var(--buy)]">
                  {formatPct(a.discount_pct)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section id="ranking" className="panel animate-rise-delay">
        <div className="px-4 pt-4 pb-2 flex items-end justify-between gap-3">
          <h2 className="font-display text-2xl">Discount ranking</h2>
          <span className="text-xs muted">Verified = NSE∩BSE within band</span>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Tranche</th>
                <th>Signal</th>
                <th>Discount</th>
                <th>Market</th>
                <th>Fair value</th>
                <th>Volume</th>
                <th>YTM yrs</th>
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((r) => (
                <tr key={r.isin}>
                  <td>
                    <Link
                      href={`/tranches/${encodeURIComponent(r.tranche_code)}`}
                      className="text-[var(--gold-bright)] hover:underline"
                    >
                      {r.tranche_code}
                    </Link>
                  </td>
                  <td>
                    <SignalBadge signal={r.signal} />
                  </td>
                  <td
                    className={`num ${
                      r.discount_pct >= 0
                        ? "text-[var(--buy)]"
                        : "text-[var(--skip)]"
                    }`}
                  >
                    {formatPct(r.discount_pct)}
                  </td>
                  <td className="num">₹{formatInr(r.market_price)}</td>
                  <td className="num">₹{formatInr(r.fair_value)}</td>
                  <td className="num">{formatInr(r.volume, 0)}</td>
                  <td className="num">{formatYears(r.years_to_maturity)}</td>
                  <td className="text-xs">
                    {r.price_verified ? (
                      <span className="text-[var(--buy)]">verified</span>
                    ) : (
                      <span className="text-[var(--warn)]">unverified</span>
                    )}
                    {r.price_outlier ? (
                      <span className="text-[var(--skip)]"> · outlier</span>
                    ) : null}
                    {!r.liquidity_ok ? (
                      <span className="muted"> · thin</span>
                    ) : null}
                  </td>
                </tr>
              ))}
              {ranking.length === 0 && (
                <tr>
                  <td colSpan={8} className="muted py-8 text-center">
                    No prices yet — run ingest from Settings.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
