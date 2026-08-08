"use client";

import { Tip } from "@/components/Tip";
import { trustFromFlags } from "@/lib/plain-language";

export function TrustBadge({
  verified,
  outlier,
  thin,
}: {
  verified: boolean | number;
  outlier: boolean | number;
  thin?: boolean | number;
}) {
  const t = trustFromFlags({ verified, outlier, thin });
  const color =
    t.level === "confirmed"
      ? "var(--buy)"
      : t.level === "caution"
        ? "var(--warn)"
        : "var(--skip)";
  const tip = [t.detail, t.thinNote].filter(Boolean).join(" ");

  return (
    <Tip label={tip}>
      <span
        className="inline-flex items-center gap-1.5 text-xs"
        style={{ color }}
      >
        <span
          className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
          style={{ background: color }}
          aria-hidden
        />
        <span>{t.label}</span>
        {t.thinNote ? (
          <span className="muted">· quiet trading</span>
        ) : null}
      </span>
    </Tip>
  );
}
