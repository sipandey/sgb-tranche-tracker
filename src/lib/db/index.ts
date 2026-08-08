import { createClient, type Client, type InValue, type ResultSet } from "@libsql/client";
import fs from "fs";
import path from "path";
import { DEFAULT_SETTINGS, SCHEMA_SQL } from "./schema";
import { SEED_TRANCHES } from "./seed-tranches";
import type { AppSettings } from "./types";

export type { AppSettings } from "./types";

let client: Client | null = null;
let initPromise: Promise<Client> | null = null;

function resolveDbUrl(): { url: string; authToken?: string } {
  const tursoUrl = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN;

  if (tursoUrl) {
    return { url: tursoUrl, authToken };
  }

  const dataDir = path.join(/*turbopackIgnore: true*/ process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const filePath =
    process.env.SGB_DB_PATH || path.join(dataDir, "sgb.sqlite");
  const abs = path.isAbsolute(filePath)
    ? filePath
    : path.join(/*turbopackIgnore: true*/ process.cwd(), filePath);
  const dir = path.dirname(abs);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  // libsql file URLs need three slashes for absolute paths: file:///path
  return { url: `file://${abs}` };
}

export function getClient(): Client {
  if (client) return client;
  const { url, authToken } = resolveDbUrl();
  client = createClient({ url, authToken });
  return client;
}

export async function ensureDb(): Promise<Client> {
  if (!initPromise) {
    initPromise = (async () => {
      const c = getClient();
      await c.executeMultiple(SCHEMA_SQL);
      await seedIfEmpty(c);
      return c;
    })();
  }
  return initPromise;
}

function rowObjects<T>(rs: ResultSet): T[] {
  return rs.rows.map((row) => {
    const obj: Record<string, unknown> = {};
    for (const col of rs.columns) {
      obj[col] = row[col];
    }
    return obj as T;
  });
}

export async function queryAll<T>(
  sql: string,
  args: InValue[] = []
): Promise<T[]> {
  const c = await ensureDb();
  const rs = await c.execute({ sql, args });
  return rowObjects<T>(rs);
}

export async function queryOne<T>(
  sql: string,
  args: InValue[] = []
): Promise<T | null> {
  const rows = await queryAll<T>(sql, args);
  return rows[0] ?? null;
}

export async function execute(
  sql: string,
  args: InValue[] = []
): Promise<ResultSet> {
  const c = await ensureDb();
  return c.execute({ sql, args });
}

export async function batch(
  statements: { sql: string; args?: InValue[] }[]
): Promise<ResultSet[]> {
  const c = await ensureDb();
  return c.batch(
    statements.map((s) => ({ sql: s.sql, args: s.args ?? [] })),
    "write"
  );
}

async function seedIfEmpty(c: Client) {
  const countRs = await c.execute("SELECT COUNT(*) AS c FROM tranches");
  const count = Number(countRs.rows[0]?.c ?? 0);
  if (count === 0) {
    const stmts = SEED_TRANCHES.map((t) => ({
      sql: `INSERT INTO tranches (
        isin, tranche_code, nse_symbol, bse_scrip_code,
        issue_date, maturity_date, issue_price, coupon_pa, units_per_bond, active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      args: [
        t.isin,
        t.tranche_code,
        t.nse_symbol,
        t.bse_scrip_code ?? null,
        t.issue_date,
        t.maturity_date,
        t.issue_price,
        t.coupon_pa ?? 2.5,
        t.units_per_bond ?? 1.0,
      ] as InValue[],
    }));
    await c.batch(stmts, "write");
  }

  const settingStmts = Object.entries(DEFAULT_SETTINGS).map(([k, v]) => ({
    sql: `INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING`,
    args: [k, v] as InValue[],
  }));
  await c.batch(settingStmts, "write");
}

export function closeDb() {
  if (client) {
    client.close();
    client = null;
    initPromise = null;
  }
}

export async function getSettings(): Promise<AppSettings> {
  const rows = await queryAll<{ key: string; value: string }>(
    "SELECT key, value FROM settings"
  );
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return {
    dry_powder_inr: Number(map.dry_powder_inr ?? DEFAULT_SETTINGS.dry_powder_inr),
    dry_powder_remaining_inr: Number(
      map.dry_powder_remaining_inr ?? DEFAULT_SETTINGS.dry_powder_remaining_inr
    ),
    cg_tax_rate_pct: Number(map.cg_tax_rate_pct ?? DEFAULT_SETTINGS.cg_tax_rate_pct),
    income_tax_slab_pct: Number(
      map.income_tax_slab_pct ?? DEFAULT_SETTINGS.income_tax_slab_pct
    ),
    gold_cagr_scenarios: JSON.parse(
      map.gold_cagr_scenarios ?? DEFAULT_SETTINGS.gold_cagr_scenarios
    ) as number[],
    switch_threshold_pct: Number(
      map.switch_threshold_pct ?? DEFAULT_SETTINGS.switch_threshold_pct
    ),
    watched_isins: JSON.parse(
      map.watched_isins ?? DEFAULT_SETTINGS.watched_isins
    ) as string[],
    min_volume_for_large_deploy: Number(
      map.min_volume_for_large_deploy ?? DEFAULT_SETTINGS.min_volume_for_large_deploy
    ),
    price_outlier_threshold_pct: Number(
      map.price_outlier_threshold_pct ?? DEFAULT_SETTINGS.price_outlier_threshold_pct
    ),
    ibja_access_token: map.ibja_access_token ?? "",
    last_session_date: map.last_session_date ?? "",
  };
}

export async function setSetting(key: string, value: string) {
  await execute(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
    [key, value]
  );
}

export async function updateSettings(partial: Partial<AppSettings>) {
  if (partial.dry_powder_inr !== undefined) {
    await setSetting("dry_powder_inr", String(partial.dry_powder_inr));
  }
  if (partial.dry_powder_remaining_inr !== undefined) {
    await setSetting("dry_powder_remaining_inr", String(partial.dry_powder_remaining_inr));
  }
  if (partial.cg_tax_rate_pct !== undefined) {
    await setSetting("cg_tax_rate_pct", String(partial.cg_tax_rate_pct));
  }
  if (partial.income_tax_slab_pct !== undefined) {
    await setSetting("income_tax_slab_pct", String(partial.income_tax_slab_pct));
  }
  if (partial.gold_cagr_scenarios !== undefined) {
    await setSetting("gold_cagr_scenarios", JSON.stringify(partial.gold_cagr_scenarios));
  }
  if (partial.switch_threshold_pct !== undefined) {
    await setSetting("switch_threshold_pct", String(partial.switch_threshold_pct));
  }
  if (partial.watched_isins !== undefined) {
    await setSetting("watched_isins", JSON.stringify(partial.watched_isins));
  }
  if (partial.min_volume_for_large_deploy !== undefined) {
    await setSetting(
      "min_volume_for_large_deploy",
      String(partial.min_volume_for_large_deploy)
    );
  }
  if (partial.price_outlier_threshold_pct !== undefined) {
    await setSetting(
      "price_outlier_threshold_pct",
      String(partial.price_outlier_threshold_pct)
    );
  }
  if (partial.ibja_access_token !== undefined) {
    await setSetting("ibja_access_token", partial.ibja_access_token);
  }
  if (partial.last_session_date !== undefined) {
    await setSetting("last_session_date", partial.last_session_date);
  }
}
