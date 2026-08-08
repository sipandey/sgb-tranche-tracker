"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RefreshButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/ingest/run", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Ingest failed");
      setMsg(
        json.demo
          ? `Demo session ${json.sessionDate}`
          : `Session ${json.sessionDate} · ${json.metrics} tranches`
      );
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button type="button" className="btn btn-ghost" onClick={run} disabled={busy}>
        {busy ? "Refreshing…" : "Refresh data"}
      </button>
      {msg && <span className="text-xs muted">{msg}</span>}
    </div>
  );
}
