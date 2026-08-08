"use client";

import { Tip } from "@/components/Tip";
import { discountPlain } from "@/lib/plain-language";

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
    <Tip label={d.full}>
      <span
        className={`num ${positive ? "text-[var(--buy)]" : "text-[var(--skip)]"}`}
      >
        {compact ? (
          <>
            {positive ? "Cheaper " : "Pricier "}
            {Math.abs(discountPct).toFixed(2)}%
          </>
        ) : (
          d.short
        )}
      </span>
    </Tip>
  );
}
