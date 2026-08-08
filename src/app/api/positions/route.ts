import { NextResponse } from "next/server";
import { execute, queryOne } from "@/lib/db";
import { getPositions } from "@/lib/db/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ lots: await getPositions() });
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

    const exists = await queryOne<{ isin: string }>(
      `SELECT isin FROM tranches WHERE isin = ?`,
      [isin]
    );
    if (!exists) {
      return NextResponse.json({ error: "Unknown ISIN" }, { status: 400 });
    }

    const info = await execute(
      `INSERT INTO position_lots (isin, units, cost_per_unit, purchase_date, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [isin, units, cost, purchase_date, notes]
    );

    const remaining = await queryOne<{ value: string }>(
      `SELECT value FROM settings WHERE key = 'dry_powder_remaining_inr'`
    );
    if (remaining) {
      const next = Math.max(0, Number(remaining.value) - units * cost);
      await execute(
        `UPDATE settings SET value = ?, updated_at = datetime('now') WHERE key = 'dry_powder_remaining_inr'`,
        [String(next)]
      );
    }

    return NextResponse.json({ id: Number(info.lastInsertRowid), ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
