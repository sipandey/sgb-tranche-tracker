import { getActionLog, getLastSessionDate } from "@/lib/db/queries";
import { DisclaimerBanner } from "@/components/Disclaimer";
import { SessionStamp } from "@/components/SessionStamp";
import { SignalBadge } from "@/components/SignalBadge";
import { PageExplainer } from "@/components/PageExplainer";
import { DiscountLabel } from "@/components/DiscountLabel";
import { formatInr } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function LogPage() {
  const logs = await getActionLog(300);
  const sessionDate = await getLastSessionDate();

  const months = new Map<string, typeof logs>();
  for (const row of logs) {
    const key = row.session_date.slice(0, 7);
    const list = months.get(key) ?? [];
    list.push(row);
    months.set(key, list);
  }

  // First signal in the whole log gets the plain explanation once
  const seen = new Set<string>();

  return (
    <div className="pt-8">
      <h1 className="font-display text-4xl tracking-tight mb-2">Action log</h1>
      <p className="muted mb-4 max-w-2xl">
        What the rules suggested each trading day — buy, skip, or hold — plus
        suggested amount and how much you’ve already put in.
      </p>
      <SessionStamp sessionDate={sessionDate} />
      <div className="mt-4">
        <PageExplainer title="How to read this log">
          <p>
            Each row is a checklist item from the rules engine for that day. It
            is not an order placed with a broker. Suggested size uses your “cash
            set aside” pool in Settings.
          </p>
        </PageExplainer>
        <DisclaimerBanner />
      </div>

      {[...months.entries()].map(([month, rows]) => (
        <section key={month} className="panel mb-6">
          <div className="px-4 pt-4 pb-2 flex justify-between items-baseline">
            <h2 className="font-display text-xl">{month}</h2>
            <span className="text-xs muted">{rows.length} notes</span>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Trading day</th>
                  <th>Bond</th>
                  <th>Signal</th>
                  <th>vs gold</th>
                  <th>Suggested ₹</th>
                  <th>Units so far</th>
                  <th>Capital so far</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const showExplain =
                    !!r.signal && !seen.has(r.signal);
                  if (r.signal) seen.add(r.signal);
                  return (
                    <tr key={r.id}>
                      <td className="num">{r.session_date}</td>
                      <td>{r.tranche_code ?? "—"}</td>
                      <td>
                        <SignalBadge
                          signal={r.signal}
                          showExplain={showExplain}
                        />
                      </td>
                      <td>
                        {r.discount_pct == null ? (
                          "—"
                        ) : (
                          <DiscountLabel
                            discountPct={Number(r.discount_pct)}
                            compact
                          />
                        )}
                      </td>
                      <td className="num">
                        {r.size_suggestion != null
                          ? `₹${formatInr(r.size_suggestion, 0)}`
                          : "—"}
                      </td>
                      <td className="num">
                        {formatInr(r.cumulative_units, 0)}
                      </td>
                      <td className="num">
                        ₹{formatInr(r.cumulative_capital, 0)}
                      </td>
                      <td className="text-xs muted max-w-xs truncate">
                        {r.note ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {logs.length === 0 && (
        <p className="muted panel p-6 text-center">
          No actions yet — refresh market data from Settings to generate
          suggestions.
        </p>
      )}
    </div>
  );
}
