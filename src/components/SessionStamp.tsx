export function SessionStamp({
  sessionDate,
  goldRate,
  goldSource,
  demo,
}: {
  sessionDate: string | null;
  goldRate?: number | null;
  goldSource?: string | null;
  demo?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm muted">
      <span>
        As of last session{" "}
        <span className="num text-[var(--ink)]">
          {sessionDate ?? "—"}
        </span>
        {!sessionDate && " (no trading data yet)"}
      </span>
      {goldRate != null && (
        <span>
          IBJA 999{" "}
          <span className="num text-[var(--gold-bright)]">
            ₹{goldRate.toLocaleString("en-IN")}/10g
          </span>
          {goldSource ? ` · ${goldSource}` : null}
        </span>
      )}
      {demo && (
        <span className="text-[var(--warn)]">Demo data — live feeds unavailable</span>
      )}
    </div>
  );
}
