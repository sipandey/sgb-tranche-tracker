"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DiscountLabel } from "@/components/DiscountLabel";
import { SignalBadge } from "@/components/SignalBadge";
import { TrustBadge } from "@/components/TrustBadge";
import { YearsLeft } from "@/components/YearsLeft";
import { SIGNAL_COPY } from "@/lib/plain-language";
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
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    if (showAll) return rows;
    return rows.filter(
      (r) => r.signal === "strong_buy" || r.signal === "buy"
    );
  }, [rows, showAll]);

  const buyCount = rows.filter(
    (r) => r.signal === "strong_buy" || r.signal === "buy"
  ).length;

  // First occurrence of each signal in the filtered list gets the plain line
  const firstOf = new Map<string, string>();
  for (const r of filtered) {
    if (r.signal && !firstOf.has(r.signal)) firstOf.set(r.signal, r.isin);
  }

  return (
    <section id="ranking" className="panel animate-rise-delay">
      <div className="px-4 pt-4 pb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">Bonds worth a look</h2>
          <p className="text-xs muted mt-1 max-w-xl">
            Default list shows only Strong buy and Buy.{" "}
            {SIGNAL_COPY.skip.label} / Trickle rows stay one tap away.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-ghost text-sm self-start"
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll
            ? `Show Strong buy & Buy only (${buyCount})`
            : `Show all ${rows.length} bonds`}
        </button>
      </div>

      {/* Desktop table */}
      <div className="table-wrap hidden md:block">
        <table className="data">
          <thead>
            <tr>
              <th>Bond</th>
              <th>Signal</th>
              <th>vs gold price</th>
              <th>Market price</th>
              <th className="col-secondary">Gold-linked value</th>
              <th className="col-secondary">Trading activity</th>
              <th className="col-secondary">Time left</th>
              <th>Price confidence</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const showExplain =
                !!r.signal && firstOf.get(r.signal) === r.isin;
              return (
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
                    <SignalBadge signal={r.signal} showExplain={showExplain} />
                  </td>
                  <td>
                    <DiscountLabel
                      discountPct={Number(r.discount_pct)}
                      compact
                    />
                  </td>
                  <td className="num">₹{formatInr(Number(r.market_price))}</td>
                  <td className="num col-secondary">
                    ₹{formatInr(Number(r.fair_value))}
                  </td>
                  <td className="num col-secondary">
                    {formatInr(Number(r.volume), 0)}
                  </td>
                  <td className="col-secondary">
                    <YearsLeft years={r.years_to_maturity} />
                  </td>
                  <td>
                    <TrustBadge
                      verified={r.price_verified}
                      outlier={r.price_outlier}
                      thin={!r.liquidity_ok}
                    />
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="muted py-8 text-center">
                  No Strong buy / Buy bonds this session — try “Show all”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked cards — primary fields first */}
      <div className="md:hidden divide-y divide-[var(--line)]">
        {filtered.map((r) => {
          const open = expanded[r.isin];
          const showExplain =
            !!r.signal && firstOf.get(r.signal) === r.isin;
          return (
            <div key={r.isin} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/tranches/${encodeURIComponent(r.tranche_code)}`}
                    className="text-[var(--gold-bright)] font-medium"
                  >
                    {r.tranche_code}
                  </Link>
                  <div className="mt-1">
                    <SignalBadge signal={r.signal} showExplain={showExplain} />
                  </div>
                </div>
                <div className="text-right">
                  <DiscountLabel
                    discountPct={Number(r.discount_pct)}
                    compact
                  />
                  <div className="num text-sm mt-1">
                    ₹{formatInr(Number(r.market_price))}
                  </div>
                </div>
              </div>
              <div className="mt-2">
                <TrustBadge
                  verified={r.price_verified}
                  outlier={r.price_outlier}
                  thin={!r.liquidity_ok}
                />
              </div>
              <button
                type="button"
                className="text-xs muted mt-2 underline-offset-2 hover:underline"
                onClick={() =>
                  setExpanded((e) => ({ ...e, [r.isin]: !e[r.isin] }))
                }
              >
                {open ? "Hide details" : "Show details"}
              </button>
              {open && (
                <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="muted">Gold-linked value</dt>
                    <dd className="num">₹{formatInr(Number(r.fair_value))}</dd>
                  </div>
                  <div>
                    <dt className="muted">Trading activity</dt>
                    <dd className="num">{formatInr(Number(r.volume), 0)}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="muted">
                      Years left until this bond pays out
                    </dt>
                    <dd>
                      <YearsLeft years={r.years_to_maturity} />
                    </dd>
                  </div>
                </dl>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="muted py-8 text-center text-sm px-4">
            No Strong buy / Buy bonds this session — try “Show all”.
          </p>
        )}
      </div>
    </section>
  );
}
