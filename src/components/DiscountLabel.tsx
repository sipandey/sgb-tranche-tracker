"use client";

import { Tip } from "@/components/Tip";
import { WhatIsThis } from "@/components/Tip";
import { discountPlain } from "@/lib/plain-language";

/** Shopping-style sale sticker for positive discounts. */
export function SaleBadge({ discountPct }: { discountPct: number }) {
  const d = discountPlain(discountPct);
  const onSale = discountPct >= 0;

  return (
    <Tip label={d.full}>
      <span className={`sale-tag ${onSale ? "sale-tag--on" : "sale-tag--off"}`}>
        {onSale ? (
          <>
            <span className="sale-tag__eyebrow">On sale</span>
            <span className="sale-tag__big num">{d.saleLine}</span>
            <span className="sale-tag__sub">gold value</span>
          </>
        ) : (
          <>
            <span className="sale-tag__eyebrow">Not today</span>
            <span className="sale-tag__big num">{d.saleLine}</span>
            <span className="sale-tag__sub">above gold</span>
          </>
        )}
      </span>
    </Tip>
  );
}

export function DiscountLabel({
  discountPct,
  compact = false,
}: {
  discountPct: number;
  compact?: boolean;
}) {
  const d = discountPlain(discountPct);
  const positive = discountPct >= 0;
  return (
    <span className="inline-flex items-center">
      <Tip label={d.full}>
        <span
          className={`num ${positive ? "text-[var(--buy)]" : "text-[var(--skip)]"}`}
        >
          {compact
            ? positive
              ? `On sale ${discountPct.toFixed(1)}%`
              : `Overpriced ${Math.abs(discountPct).toFixed(1)}%`
            : d.short}
        </span>
      </Tip>
      <WhatIsThis title="What does “on sale” mean?">
        Imagine a coupon for gold. If someone sells that coupon for less than
        the gold is worth, you’re getting extra gold value for the same money —
        like a store discount. The opposite is paying more than the gold is
        worth today.
      </WhatIsThis>
    </span>
  );
}
