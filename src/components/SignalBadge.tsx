"use client";

import { Tip } from "@/components/Tip";
import { SIGNAL_COPY } from "@/lib/plain-language";

export function SignalBadge({
  signal,
  showExplain = false,
}: {
  signal: string | null | undefined;
  /** Show one-line plain explanation under the label */
  showExplain?: boolean;
}) {
  if (!signal) return <span className="muted">—</span>;
  const s = SIGNAL_COPY[signal] ?? {
    label: signal,
    plain: signal,
  };
  const color =
    signal === "strong_buy"
      ? "var(--strong)"
      : signal === "buy"
        ? "var(--buy)"
        : signal === "skip"
          ? "var(--skip)"
          : signal === "switch"
            ? "var(--warn)"
            : "var(--hold)";

  return (
    <span className="inline-flex flex-col gap-0.5 max-w-[14rem]">
      <Tip label={s.plain}>
        <span
          className="inline-flex items-center gap-1.5 text-xs tracking-wide"
          style={{ color }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ background: color }}
          />
          {s.label}
        </span>
      </Tip>
      {showExplain && (
        <span className="text-[0.7rem] leading-snug muted font-normal normal-case tracking-normal">
          {s.plain}
        </span>
      )}
    </span>
  );
}
