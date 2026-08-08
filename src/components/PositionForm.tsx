"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type TrancheOpt = { isin: string; tranche_code: string };

export function PositionForm() {
  const router = useRouter();
  const [tranches, setTranches] = useState<TrancheOpt[]>([]);
  const [isin, setIsin] = useState("");
  const [units, setUnits] = useState("10");
  const [cost, setCost] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/tranches")
      .then((r) => r.json())
      .then((j) => {
        setTranches(j.tranches ?? []);
        if (j.tranches?.[0]) setIsin(j.tranches[0].isin);
      })
      .catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isin,
          units: Number(units),
          cost_per_unit: Number(cost),
          purchase_date: date,
          notes: notes || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setMsg("Lot added");
      setCost("");
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="panel p-4 grid sm:grid-cols-5 gap-3 items-end">
      <div className="sm:col-span-2">
        <label className="label" htmlFor="isin">
          Tranche
        </label>
        <select
          id="isin"
          className="select"
          value={isin}
          onChange={(e) => setIsin(e.target.value)}
        >
          {tranches.map((t) => (
            <option key={t.isin} value={t.isin}>
              {t.tranche_code}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="units">
          Units
        </label>
        <input
          id="units"
          className="input"
          value={units}
          onChange={(e) => setUnits(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="cost">
          Cost / unit ₹
        </label>
        <input
          id="cost"
          className="input"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="date">
          Purchase date
        </label>
        <input
          id="date"
          type="date"
          className="input"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>
      <div className="sm:col-span-4">
        <label className="label" htmlFor="notes">
          Notes
        </label>
        <input
          id="notes"
          className="input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <div>
        <button type="submit" className="btn w-full" disabled={busy}>
          {busy ? "Saving…" : "Add lot"}
        </button>
      </div>
      {msg && (
        <p className="sm:col-span-5 text-xs muted">{msg}</p>
      )}
    </form>
  );
}
