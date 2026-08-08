"use client";

import { Tip } from "@/components/Tip";
import { WhatIsThis } from "@/components/Tip";
import { formatCountdown } from "@/lib/plain-language";

export function YearsLeft({
  years,
  showLabel = true,
}: {
  years: number | null | undefined;
  showLabel?: boolean;
}) {
  const text = formatCountdown(years == null ? null : Number(years));
  return (
    <span className="inline-flex items-center gap-2 flex-wrap">
      <span className="piggy" aria-hidden>
        🐷
      </span>
      <Tip label="How long until this gold coupon batch pays out (years to maturity). Your money stays locked in the bond until then, unless you sell early on the exchange.">
        <span className="num">
          {showLabel ? "Locked away for: " : ""}
          {text}
        </span>
      </Tip>
      <WhatIsThis title="Locked away — what’s that?">
        Like a piggy bank with a date on it. You can sell early on the exchange
        if you need to, but the calm plan is to wait until the batch pays out.
      </WhatIsThis>
    </span>
  );
}
