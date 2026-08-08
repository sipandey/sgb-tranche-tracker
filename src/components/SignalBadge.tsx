const STYLES: Record<string, { bg: string; label: string }> = {
  strong_buy: { bg: "var(--strong)", label: "Strong buy" },
  buy: { bg: "var(--buy)", label: "Buy" },
  trickle: { bg: "var(--hold)", label: "Trickle" },
  skip: { bg: "var(--skip)", label: "Skip" },
  hold: { bg: "var(--hold)", label: "Hold" },
  switch: { bg: "var(--warn)", label: "Switch?" },
};

export function SignalBadge({ signal }: { signal: string | null | undefined }) {
  if (!signal) return <span className="muted">—</span>;
  const s = STYLES[signal] ?? { bg: "var(--ink-muted)", label: signal };
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs tracking-wide"
      style={{ color: s.bg }}
    >
      <span
        className="inline-block w-1.5 h-1.5 rounded-full"
        style={{ background: s.bg }}
      />
      {s.label}
    </span>
  );
}
