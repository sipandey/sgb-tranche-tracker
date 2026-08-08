import { getActionLog, getLastSessionDate } from "@/lib/db/queries";
import { DisclaimerBanner } from "@/components/Disclaimer";
import { SessionStamp } from "@/components/SessionStamp";
import { SignalBadge } from "@/components/SignalBadge";
import { formatInr, formatPct } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function LogPage() {
  const logs = await getActionLog(300);
  const sessionDate = await getLastSessionDate();

  // Group by YYYY-MM
  const months = new Map<string, typeof logs>();
  for (const row of logs) {
    const key = row.session_date.slice(0, 7);
    const list = months.get(key) ?? [];
    list.push(row);
    months.set(key, list);
  }

  return (
    <div className="pt-8">
      <h1 className="font-display text-4xl tracking-tight mb-2">Buy-pattern log</h1>
      <p className="muted mb-4 max-w-2xl">
        Rule-triggered actions per session with suggested size and running
        cumulative units / capital from recorded lots.
      </p>
      <SessionStamp sessionDate={sessionDate} />
      <div className="mt-4">
        <DisclaimerBanner />
      </div>

      {[...months.entries()].map(([month, rows]) => (
        <section key={month} className="panel mb-6">
          <div className="px-4 pt-4 pb-2 flex justify-between items-baseline">
            <h2 className="font-display text-xl">{month}</h2>
            <span className="text-xs muted">{rows.length} actions</span>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Tranche</th>
                  <th>Signal</th>
                  <th>Discount</th>
                  <th>Size ₹</th>
                  <th>Cum. units</th>
                  <th>Cum. capital</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="num">{r.session_date}</td>
                    <td>{r.tranche_code ?? "—"}</td>
                    <td>
                      <SignalBadge signal={r.signal} />
                    </td>
                    <td className="num">{formatPct(r.discount_pct)}</td>
                    <td className="num">
                      {r.size_suggestion != null
                        ? `₹${formatInr(r.size_suggestion, 0)}`
                        : "—"}
                    </td>
                    <td className="num">{formatInr(r.cumulative_units, 0)}</td>
                    <td className="num">₹{formatInr(r.cumulative_capital, 0)}</td>
                    <td className="text-xs muted max-w-xs truncate">
                      {r.note ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {logs.length === 0 && (
        <p className="muted panel p-6 text-center">
          No actions yet — run ingest to generate rule signals.
        </p>
      )}
    </div>
  );
}
