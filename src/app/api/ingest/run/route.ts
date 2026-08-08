import { NextResponse } from "next/server";
import { runIngest } from "@/lib/ingest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const preferDate =
      typeof body.sessionDate === "string" ? body.sessionDate : undefined;
    const forceDemo = Boolean(body.forceDemo);
    const result = forceDemo
      ? await runIngest(preferDate, { allowDemoFallback: true }).then(async (r) => {
          if (forceDemo) {
            const { seedDemoSession } = await import("@/lib/ingest/demo");
            const seeded = seedDemoSession(preferDate || "2026-08-07");
            return {
              ...r,
              ok: true,
              sessionDate: seeded.sessionDate,
              metrics: seeded.metrics,
              demo: true,
            };
          }
          return r;
        })
      : await runIngest(preferDate);

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ingest failed" },
      { status: 500 }
    );
  }
}
