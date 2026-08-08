import { updateSettings } from "@/lib/db";
import { runRulesForSession } from "@/lib/rules";
import { ingestBsePrices } from "./bse";
import { crossCheckPrices } from "./cross-check";
import { seedDemoSession } from "./demo";
import { ingestGoldSpot } from "./ibja";
import { materializeDailyMetrics } from "./metrics";
import { ingestNsePrices } from "./nse";

export type IngestResult = {
  ok: boolean;
  sessionDate: string | null;
  nse: { count: number; error?: string };
  bse: { count: number; error?: string };
  gold: { ok: boolean; rate?: number; source?: string; error?: string };
  crossCheck: { verified: number; outliers: number; singleSource: number } | null;
  metrics: number;
  rules: ReturnType<typeof runRulesForSession> | null;
  errors: string[];
  demo?: boolean;
};

export async function runIngest(
  preferDate?: string,
  opts?: { allowDemoFallback?: boolean }
): Promise<IngestResult> {
  const errors: string[] = [];
  const allowDemo = opts?.allowDemoFallback !== false;

  const nse = await ingestNsePrices(preferDate);
  if (nse.error) errors.push(`NSE: ${nse.error}`);

  // Prefer aligning BSE to NSE session when NSE succeeded
  const bse = await ingestBsePrices(nse.sessionDate ?? preferDate);
  if (bse.error) errors.push(`BSE: ${bse.error}`);

  let sessionDate = nse.sessionDate || bse.sessionDate || null;

  let gold = await ingestGoldSpot(sessionDate ?? undefined);
  if (!gold.ok) errors.push(`Gold: ${gold.error}`);

  let crossCheck = null;
  let metrics = 0;
  let rules = null;
  let demo = false;

  // Fallback to demo data if live feeds produced nothing usable
  if ((!sessionDate || !gold.ok) && allowDemo) {
    const seeded = seedDemoSession(preferDate || "2026-08-07");
    sessionDate = seeded.sessionDate;
    metrics = seeded.metrics;
    demo = true;
    gold = {
      ok: true,
      quote: {
        ratePer10g: 149020,
        sessionDate,
        source: "ibja_scrape",
      },
    };
    errors.push("Live feeds incomplete — loaded demo session for UI");
    rules = { sessionDate, rankedCount: metrics, suggestions: 0, alerts: 0 };
    return {
      ok: true,
      sessionDate,
      nse: { count: nse.count, error: nse.error },
      bse: { count: bse.count, error: bse.error },
      gold: {
        ok: true,
        rate: 149020,
        source: "ibja_scrape",
        error: gold.error,
      },
      crossCheck: null,
      metrics,
      rules,
      errors,
      demo: true,
    };
  }

  if (sessionDate) {
    updateSettings({ last_session_date: sessionDate });
    crossCheck = crossCheckPrices(sessionDate);
    if (gold.ok) {
      metrics = materializeDailyMetrics(sessionDate);
      rules = runRulesForSession(sessionDate);
    }
  }

  return {
    ok: Boolean(sessionDate) && Boolean(gold.ok) && metrics > 0,
    sessionDate,
    nse: { count: nse.count, error: nse.error },
    bse: { count: bse.count, error: bse.error },
    gold: {
      ok: gold.ok,
      rate: gold.quote?.ratePer10g,
      source: gold.quote?.source,
      error: gold.error,
    },
    crossCheck,
    metrics,
    rules,
    errors,
    demo,
  };
}
