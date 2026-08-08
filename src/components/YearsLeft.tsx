"use client";

import { Tip } from "@/components/Tip";
import { formatCountdown } from "@/lib/plain-language";

export function YearsLeft({
  years,
}: {
  years: number | null | undefined;
}) {
  const text = formatCountdown(
    years == null ? null : Number(years)
  );
  return (
    <Tip label="Years left until this bond pays out (time to maturity / YTM years)">
      <span className="num">{text}</span>
    </Tip>
  );
}
