import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { DEFAULT_SETTINGS, SCHEMA_SQL } from "./schema";
import { SEED_TRANCHES } from "./seed-tranches";
import type { AppSettings } from "./types";

export type { AppSettings } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = process.env.SGB_DB_PATH || path.join(DATA_DIR, "sgb.sqlite");

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (dbInstance) return dbInstance;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA_SQL);
  seedIfEmpty(db);
  dbInstance = db;
  return db;
}

function seedIfEmpty(db: Database.Database) {
  const row = db.prepare("SELECT COUNT(*) AS c FROM tranches").get() as { c: number };
  if (row.c === 0) {
    const insert = db.prepare(`
      INSERT INTO tranches (
        isin, tranche_code, nse_symbol, bse_scrip_code,
        issue_date, maturity_date, issue_price, coupon_pa, units_per_bond, active
      ) VALUES (
        @isin, @tranche_code, @nse_symbol, @bse_scrip_code,
        @issue_date, @maturity_date, @issue_price, @coupon_pa, @units_per_bond, 1
      )
    `);
    const tx = db.transaction(() => {
      for (const t of SEED_TRANCHES) {
        insert.run({
          isin: t.isin,
          tranche_code: t.tranche_code,
          nse_symbol: t.nse_symbol,
          bse_scrip_code: t.bse_scrip_code ?? null,
          issue_date: t.issue_date,
          maturity_date: t.maturity_date,
          issue_price: t.issue_price,
          coupon_pa: t.coupon_pa ?? 2.5,
          units_per_bond: t.units_per_bond ?? 1.0,
        });
      }
    });
    tx();
  }

  const upsert = db.prepare(`
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO NOTHING
  `);
  const txSettings = db.transaction(() => {
    for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
      upsert.run(k, v);
    }
  });
  txSettings();
}

export function closeDb() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

export function getSettings(): AppSettings {
  const db = getDb();
  const rows = db.prepare("SELECT key, value FROM settings").all() as {
    key: string;
    value: string;
  }[];
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

export function setSetting(key: string, value: string) {
  const db = getDb();
  db.prepare(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
  ).run(key, value);
}

export function updateSettings(partial: Partial<AppSettings>) {
  if (partial.dry_powder_inr !== undefined) {
    setSetting("dry_powder_inr", String(partial.dry_powder_inr));
  }
  if (partial.dry_powder_remaining_inr !== undefined) {
    setSetting("dry_powder_remaining_inr", String(partial.dry_powder_remaining_inr));
  }
  if (partial.cg_tax_rate_pct !== undefined) {
    setSetting("cg_tax_rate_pct", String(partial.cg_tax_rate_pct));
  }
  if (partial.income_tax_slab_pct !== undefined) {
    setSetting("income_tax_slab_pct", String(partial.income_tax_slab_pct));
  }
  if (partial.gold_cagr_scenarios !== undefined) {
    setSetting("gold_cagr_scenarios", JSON.stringify(partial.gold_cagr_scenarios));
  }
  if (partial.switch_threshold_pct !== undefined) {
    setSetting("switch_threshold_pct", String(partial.switch_threshold_pct));
  }
  if (partial.watched_isins !== undefined) {
    setSetting("watched_isins", JSON.stringify(partial.watched_isins));
  }
  if (partial.min_volume_for_large_deploy !== undefined) {
    setSetting("min_volume_for_large_deploy", String(partial.min_volume_for_large_deploy));
  }
  if (partial.price_outlier_threshold_pct !== undefined) {
    setSetting(
      "price_outlier_threshold_pct",
      String(partial.price_outlier_threshold_pct)
    );
  }
  if (partial.ibja_access_token !== undefined) {
    setSetting("ibja_access_token", partial.ibja_access_token);
  }
  if (partial.last_session_date !== undefined) {
    setSetting("last_session_date", partial.last_session_date);
  }
}
