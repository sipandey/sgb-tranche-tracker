import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getPositions } from "@/lib/db/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ lots: getPositions() });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const isin = String(body.isin || "");
    const units = Number(body.units);
    const cost = Number(body.cost_per_unit);
    const purchase_date = String(body.purchase_date || "");
    const notes = body.notes ? String(body.notes) : null;

    if (!isin || !purchase_date || !Number.isFinite(units) || units <= 0) {
      return NextResponse.json({ error: "Invalid lot" }, { status: 400 });
    }
    if (!Number.isFinite(cost) || cost <= 0) {
      return NextResponse.json({ error: "Invalid cost" }, { status: 400 });
    }

    const db = getDb();
    const exists = db
      .prepare(`SELECT isin FROM tranches WHERE isin = ?`)
      .get(isin);
    if (!exists) {
      return NextResponse.json({ error: "Unknown ISIN" }, { status: 400 });
    }

    const info = db
      .prepare(
        `INSERT INTO position_lots (isin, units, cost_per_unit, purchase_date, notes)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(isin, units, cost, purchase_date, notes);

    // Reduce dry powder remaining by cost (opportunistic pool)
    const remaining = db
      .prepare(`SELECT value FROM settings WHERE key = 'dry_powder_remaining_inr'`)
      .get() as { value: string } | undefined;
    if (remaining) {
      const next = Math.max(0, Number(remaining.value) - units * cost);
      db.prepare(
        `UPDATE settings SET value = ?, updated_at = datetime('now') WHERE key = 'dry_powder_remaining_inr'`
      ).run(String(next));
    }

    return NextResponse.json({ id: info.lastInsertRowid, ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
