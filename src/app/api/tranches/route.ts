import { NextResponse } from "next/server";
import { getActiveTranches } from "@/lib/db/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const tranches = getActiveTranches().map((t) => ({
    isin: t.isin,
    tranche_code: t.tranche_code,
    maturity_date: t.maturity_date,
  }));
  return NextResponse.json({ tranches });
}
