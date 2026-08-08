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
        Prices as of last trading day{" "}
        <span className="num text-[var(--ink)]">
          {sessionDate ?? "—"}
        </span>
        {!sessionDate && " (no market data yet)"}
      </span>
      {goldRate != null && (
        <span>
          Actual gold price (IBJA 999){" "}
          <span className="num text-[var(--gold-bright)]">
            ₹{goldRate.toLocaleString("en-IN")}/10g
          </span>
          {goldSource ? ` · ${goldSource}` : null}
        </span>
      )}
      {demo && (
        <span className="text-[var(--warn)]">
          Sample data — live market feeds were unavailable
        </span>
      )}
    </div>
  );
}
