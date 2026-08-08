"use client";

import { Tip } from "@/components/Tip";
import { SIGNAL_COPY } from "@/lib/plain-language";

export function SignalBadge({
  signal,
  showExplain = false,
  large = false,
}: {
  signal: string | null | undefined;
  showExplain?: boolean;
  large?: boolean;
}) {
  if (!signal) return <span className="muted">—</span>;
  const s = SIGNAL_COPY[signal] ?? {
    label: signal,
    friendly: signal,
    plain: signal,
    icon: "•",
    color: "var(--ink-muted)",
  };

  return (
    <span className="inline-flex flex-col gap-1 max-w-[16rem]">
      <Tip label={s.plain}>
        <span
          className={`inline-flex items-center gap-1.5 ${
            large ? "text-sm" : "text-xs"
          } tracking-wide`}
          style={{ color: s.color }}
        >
          <span aria-hidden className={large ? "text-base" : "text-sm"}>
            {s.icon}
          </span>
          <span className="font-medium">{s.friendly}</span>
          <span className="muted font-normal opacity-70">({s.label})</span>
        </span>
      </Tip>
      {showExplain && (
        <span className="text-[0.72rem] leading-snug muted font-normal normal-case tracking-normal">
          {s.plain}
        </span>
      )}
    </span>
  );
}
