import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ settings: getSettings() });
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    updateSettings({
      dry_powder_inr: num(body.dry_powder_inr),
      dry_powder_remaining_inr: num(body.dry_powder_remaining_inr),
      cg_tax_rate_pct: num(body.cg_tax_rate_pct),
      income_tax_slab_pct: num(body.income_tax_slab_pct),
      gold_cagr_scenarios: Array.isArray(body.gold_cagr_scenarios)
        ? body.gold_cagr_scenarios.map(Number)
        : undefined,
      switch_threshold_pct: num(body.switch_threshold_pct),
      min_volume_for_large_deploy: num(body.min_volume_for_large_deploy),
      price_outlier_threshold_pct: num(body.price_outlier_threshold_pct),
      ibja_access_token:
        typeof body.ibja_access_token === "string"
          ? body.ibja_access_token
          : undefined,
      watched_isins: Array.isArray(body.watched_isins)
        ? body.watched_isins.map(String)
        : undefined,
    });
    return NextResponse.json({ settings: getSettings() });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 400 }
    );
  }
}

function num(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
