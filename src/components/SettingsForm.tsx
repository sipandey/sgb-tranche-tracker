"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AppSettings } from "@/lib/db/types";

export function SettingsForm({
  settings,
  tranches,
}: {
  settings: AppSettings;
  tranches: { isin: string; tranche_code: string }[];
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    dry_powder_inr: String(settings.dry_powder_inr),
    dry_powder_remaining_inr: String(settings.dry_powder_remaining_inr),
    cg_tax_rate_pct: String(settings.cg_tax_rate_pct),
    income_tax_slab_pct: String(settings.income_tax_slab_pct),
    gold_cagr_scenarios: settings.gold_cagr_scenarios.join(","),
    switch_threshold_pct: String(settings.switch_threshold_pct),
    min_volume_for_large_deploy: String(settings.min_volume_for_large_deploy),
    price_outlier_threshold_pct: String(settings.price_outlier_threshold_pct),
    ibja_access_token: settings.ibja_access_token,
    watched_isins: settings.watched_isins,
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function toggleWatch(isin: string) {
    setForm((f) => {
      const set = new Set(f.watched_isins);
      if (set.has(isin)) set.delete(isin);
      else set.add(isin);
      return { ...f, watched_isins: [...set] };
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const body = {
        dry_powder_inr: Number(form.dry_powder_inr),
        dry_powder_remaining_inr: Number(form.dry_powder_remaining_inr),
        cg_tax_rate_pct: Number(form.cg_tax_rate_pct),
        income_tax_slab_pct: Number(form.income_tax_slab_pct),
        gold_cagr_scenarios: form.gold_cagr_scenarios
          .split(",")
          .map((s) => Number(s.trim()))
          .filter((n) => Number.isFinite(n)),
        switch_threshold_pct: Number(form.switch_threshold_pct),
        min_volume_for_large_deploy: Number(form.min_volume_for_large_deploy),
        price_outlier_threshold_pct: Number(form.price_outlier_threshold_pct),
        ibja_access_token: form.ibja_access_token,
        watched_isins: form.watched_isins,
      };
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");
      setMsg("Saved");
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function runIngest() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/ingest/run", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Ingest failed");
      setMsg(
        `Ingest ok · session ${json.sessionDate} · ${json.metrics} metrics${
          json.demo ? " (demo)" : ""
        }`
      );
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={save} className="panel p-5 grid sm:grid-cols-2 gap-4">
        <Field
          label="Dry powder cap (₹)"
          value={form.dry_powder_inr}
          onChange={(v) => setForm({ ...form, dry_powder_inr: v })}
        />
        <Field
          label="Dry powder remaining (₹)"
          value={form.dry_powder_remaining_inr}
          onChange={(v) => setForm({ ...form, dry_powder_remaining_inr: v })}
        />
        <Field
          label="Capital gains rate % (your input)"
          value={form.cg_tax_rate_pct}
          onChange={(v) => setForm({ ...form, cg_tax_rate_pct: v })}
        />
        <Field
          label="Income tax slab % for coupons (your input)"
          value={form.income_tax_slab_pct}
          onChange={(v) => setForm({ ...form, income_tax_slab_pct: v })}
        />
        <Field
          label="Gold CAGR scenarios % (comma-separated)"
          value={form.gold_cagr_scenarios}
          onChange={(v) => setForm({ ...form, gold_cagr_scenarios: v })}
        />
        <Field
          label="Switch threshold % (after-cost gap)"
          value={form.switch_threshold_pct}
          onChange={(v) => setForm({ ...form, switch_threshold_pct: v })}
        />
        <Field
          label="Min volume for large deploy"
          value={form.min_volume_for_large_deploy}
          onChange={(v) => setForm({ ...form, min_volume_for_large_deploy: v })}
        />
        <Field
          label="NSE↔BSE outlier threshold %"
          value={form.price_outlier_threshold_pct}
          onChange={(v) => setForm({ ...form, price_outlier_threshold_pct: v })}
        />
        <div className="sm:col-span-2">
          <label className="label" htmlFor="ibja">
            IBJA access token (optional — else HTML scrape)
          </label>
          <input
            id="ibja"
            className="input"
            type="password"
            autoComplete="off"
            value={form.ibja_access_token}
            onChange={(e) =>
              setForm({ ...form, ibja_access_token: e.target.value })
            }
            placeholder="Or set IBJA_ACCESS_TOKEN env"
          />
        </div>

        <div className="sm:col-span-2">
          <div className="label mb-2">Watched tranches (alerts)</div>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {tranches.map((t) => {
              const on = form.watched_isins.includes(t.isin);
              return (
                <button
                  key={t.isin}
                  type="button"
                  onClick={() => toggleWatch(t.isin)}
                  className={`text-xs px-2 py-1 border ${
                    on
                      ? "border-[var(--gold)] text-[var(--gold-bright)]"
                      : "border-[var(--line)] muted"
                  }`}
                >
                  {t.tranche_code}
                </button>
              );
            })}
          </div>
        </div>

        <div className="sm:col-span-2 flex flex-wrap gap-3 pt-2">
          <button type="submit" className="btn" disabled={busy}>
            {busy ? "Working…" : "Save settings"}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={runIngest}
            disabled={busy}
          >
            Run ingest now
          </button>
          {msg && <span className="text-sm muted self-center">{msg}</span>}
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
