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
        Shelf prices from{" "}
        <span className="num text-[var(--ink)]">
          {sessionDate ?? "—"}
        </span>
        {" "}
        (last trading day)
      </span>
      {goldRate != null && (
        <span>
          Actual gold sticker price{" "}
          <span className="num text-[var(--gold-bright)]">
            ₹{goldRate.toLocaleString("en-IN")}/10g
          </span>
          {goldSource ? ` · ${goldSource}` : null}
        </span>
      )}
      {demo && (
        <span className="text-[var(--warn)]">
          Sample shelf — live market feeds weren’t reachable
        </span>
      )}
    </div>
  );
}
