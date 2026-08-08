"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CoinStack } from "@/components/CoinStack";
import { SaleBadge } from "@/components/DiscountLabel";
import { SafetyNote } from "@/components/SafetyNote";
import { SignalBadge } from "@/components/SignalBadge";
import { TrustBadge } from "@/components/TrustBadge";
import { YearsLeft } from "@/components/YearsLeft";
import { WhatIsThis } from "@/components/Tip";
import { batchDisplayName } from "@/lib/plain-language";
import { formatInr } from "@/lib/format";

export type RankingRow = {
  isin: string;
  tranche_code: string;
  signal: string | null;
  discount_pct: number;
  market_price: number;
  fair_value: number;
  volume: number;
  years_to_maturity: number | null;
  price_verified: number;
  price_outlier: number;
  liquidity_ok: number;
};

export function RankingTable({ rows }: { rows: RankingRow[] }) {
  const [showAll, setShowAll] = useState(false);
  const [openCard, setOpenCard] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    if (showAll) return rows;
    return rows.filter(
      (r) => r.signal === "strong_buy" || r.signal === "buy"
    );
  }, [rows, showAll]);

  const buyCount = rows.filter(
    (r) => r.signal === "strong_buy" || r.signal === "buy"
  ).length;

  const firstOf = new Map<string, string>();
  for (const r of filtered) {
    if (r.signal && !firstOf.has(r.signal)) firstOf.set(r.signal, r.isin);
  }

  return (
    <section id="ranking" className="animate-rise-delay">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl">
            Coupons on sale
            <WhatIsThis title="What am I looking at?">
              Each card is one batch of gold-bond coupons people trade on the
              exchange. Bigger “extra gold” numbers usually mean a deeper sale
              versus today’s gold price.
            </WhatIsThis>
          </h2>
          <p className="text-sm muted mt-1 max-w-xl">
            We start with great and okay deals. Tap “Show every batch” if you
            want the full shelf — including “Not today.”
          </p>
        </div>
        <button
          type="button"
          className="btn btn-ghost text-sm self-start min-h-11 px-4"
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll
            ? `Just the deals (${buyCount})`
            : `Show every batch (${rows.length})`}
        </button>
      </div>

      <SafetyNote className="mb-5" />

      <div className="bond-grid">
        {filtered.map((r) => {
          const showExplain =
            !!r.signal && firstOf.get(r.signal) === r.isin;
          const details = openCard[r.isin];
          const onSale = r.discount_pct >= 0;
          return (
            <article
              key={r.isin}
              className={`bond-card panel ${onSale ? "bond-card--sale" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs muted mb-0.5">Gold coupon batch</p>
                  <Link
                    href={`/tranches/${encodeURIComponent(r.tranche_code)}`}
                    className="font-display text-xl text-[var(--gold-bright)] hover:underline leading-tight"
                  >
                    {batchDisplayName(r.tranche_code)}
                  </Link>
                  <p className="text-xs muted num mt-0.5">{r.tranche_code}</p>
                </div>
                <CoinStack discountPct={r.discount_pct} />
              </div>

              <div className="mt-4 flex items-center gap-3 flex-wrap">
                <SaleBadge discountPct={r.discount_pct} />
                <div className="text-sm">
                  <div className="muted text-xs">You’d pay about</div>
                  <div className="num text-lg">
                    ₹{formatInr(r.market_price)}
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <SignalBadge
                  signal={r.signal}
                  showExplain={showExplain}
                  large
                />
              </div>

              <p className="text-sm muted mt-3 leading-snug">
                {onSale
                  ? `Takeaway: this coupon looks cheaper than the gold behind it — a possible bargain if you can wait.`
                  : `Takeaway: sellers want more than the gold is worth today — skip for now.`}
              </p>

              <div className="mt-3">
                <TrustBadge
                  verified={r.price_verified}
                  outlier={r.price_outlier}
                  thin={!r.liquidity_ok}
                />
              </div>

              <button
                type="button"
                className="text-sm text-[var(--gold-bright)] mt-3 min-h-10"
                onClick={() =>
                  setOpenCard((e) => ({ ...e, [r.isin]: !e[r.isin] }))
                }
              >
                {details ? "Hide details" : "Show details"}
              </button>

              {details && (
                <dl className="mt-3 grid grid-cols-1 gap-2 text-sm border-t border-[var(--line)] pt-3">
                  <div>
                    <dt className="muted text-xs">Gold-linked value</dt>
                    <dd className="num">₹{formatInr(r.fair_value)}</dd>
                  </div>
                  <div>
                    <dt className="muted text-xs">How busy is trading?</dt>
                    <dd className="num">{formatInr(r.volume, 0)} units today</dd>
                  </div>
                  <div>
                    <dt className="muted text-xs mb-1">Piggy-bank timer</dt>
                    <dd>
                      <YearsLeft years={r.years_to_maturity} />
                    </dd>
                  </div>
                  <Link
                    href={`/tranches/${encodeURIComponent(r.tranche_code)}`}
                    className="btn mt-1 min-h-11"
                  >
                    Open this batch
                  </Link>
                </dl>
              )}
            </article>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="muted panel p-8 text-center text-sm">
          No “great” or “okay” deals this session — try showing every batch, or
          check back after the next trading day.
        </p>
      )}
    </section>
  );
}
