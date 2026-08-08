import { NextResponse } from "next/server";
import { execute } from "@/lib/db";
import { getAlerts } from "@/lib/db/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ alerts: await getAlerts(false, 100) });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = Number(body.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    await execute(`UPDATE alerts SET acknowledged = 1 WHERE id = ?`, [id]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
