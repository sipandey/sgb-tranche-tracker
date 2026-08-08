import { getDb } from "@/lib/db";
import {
  BROWSER_UA,
  candidateSessionDates,
  fetchText,
  formatNseDate,
  parseCsv,
  toIsoDate,
} from "./http";

export type NsePriceRow = {
  symbol: string;
  isin?: string;
  close: number;
  volume: number;
  sessionDate: string;
};

let nseCookie: string | null = null;

async function warmNseSession(): Promise<string | null> {
  const res = await fetch("https://www.nseindia.com/market-data/sovereign-gold-bond", {
    headers: {
      "User-Agent": BROWSER_UA,
      Accept: "text/html",
    },
  });
  const raw = res.headers.getSetCookie?.() ?? [];
  // Fallback: cookie header may be unavailable in undici; try get('set-cookie')
  const setCookie = res.headers.get("set-cookie");
  const cookies = raw.length
    ? raw.map((c) => c.split(";")[0]).join("; ")
    : setCookie
      ? setCookie.split(",").map((c) => c.split(";")[0].trim()).join("; ")
      : null;
  nseCookie = cookies;
  return cookies;
}

export async function fetchNseSgbLive(): Promise<
  { symbol: string; ltp: number; prevClose: number; volume: number }[]
> {
  await warmNseSession();
  const res = await fetch("https://www.nseindia.com/api/sovereign-gold-bonds", {
    headers: {
      "User-Agent": BROWSER_UA,
      Accept: "application/json",
      Referer: "https://www.nseindia.com/market-data/sovereign-gold-bond",
      ...(nseCookie ? { Cookie: nseCookie } : {}),
    },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as {
    data?: {
      symbol?: string;
      ltP?: string;
      prevClose?: string;
      totalTradedVolume?: string;
    }[];
  };
  return (json.data ?? []).map((d) => ({
    symbol: (d.symbol ?? "").trim(),
    ltp: Number(String(d.ltP ?? "0").replace(/,/g, "")),
    prevClose: Number(String(d.prevClose ?? "0").replace(/,/g, "")),
    volume: Number(String(d.totalTradedVolume ?? "0").replace(/,/g, "")),
  }));
}

export async function fetchNseBhavcopy(
  session: Date
): Promise<{ ok: boolean; rows: NsePriceRow[]; sessionDate: string; error?: string }> {
  const sessionDate = toIsoDate(session);
  const url = `https://nsearchives.nseindia.com/products/content/sec_bhavdata_full_${formatNseDate(session)}.csv`;
  const { ok, status, text } = await fetchText(url, {
    headers: { Referer: "https://www.nseindia.com/" },
  });
  if (!ok || text.toLowerCase().includes("<html")) {
    return { ok: false, rows: [], sessionDate, error: `NSE bhavcopy HTTP ${status}` };
  }
  const parsed = parseCsv(text);
  const rows: NsePriceRow[] = [];
  for (const r of parsed) {
    const series = (r.SERIES || r.Series || "").trim().toUpperCase();
    const symbol = (r.SYMBOL || r.Symbol || "").trim().toUpperCase();
    if (series !== "GB" && !symbol.startsWith("SGB")) continue;
    const close = Number(
      String(r.CLOSE_PRICE || r.CLOSE || r.Close || "0").replace(/,/g, "")
    );
    const volume = Number(
      String(r.TTL_TRD_QNTY || r.VOLUME || r.Volume || "0").replace(/,/g, "")
    );
    if (!symbol || !Number.isFinite(close) || close <= 0) continue;
    rows.push({
      symbol,
      isin: (r.ISIN || r.Isin || "").trim() || undefined,
      close,
      volume: Number.isFinite(volume) ? volume : 0,
      sessionDate,
    });
  }
  return { ok: rows.length > 0, rows, sessionDate };
}

export async function fetchNseIsinMaster(): Promise<
  { symbol: string; isin: string; name: string }[]
> {
  const url =
    "https://nsearchives.nseindia.com/content/equities/LISTOF_ACTIVE_SECURITIES_CM_DEBT.csv";
  // Alternate filename casing used historically
  const urls = [
    url,
    "https://nsearchives.nseindia.com/content/equities/List_of_Active_Securities_CM_DEBT.csv",
  ];
  for (const u of urls) {
    const { ok, text } = await fetchText(u);
    if (!ok || text.toLowerCase().includes("<html")) continue;
    const parsed = parseCsv(text);
    const out: { symbol: string; isin: string; name: string }[] = [];
    for (const r of parsed) {
      const name = Object.values(r).join(" ");
      const upper = name.toUpperCase();
      if (!upper.includes("GOLD") && !upper.includes("SGB")) continue;
      const isin =
        (r.ISIN || r.Isin || r["ISIN NUMBER"] || "").trim() ||
        Object.values(r).find((v) => /^IN\d{10}$/.test(v.trim()))?.trim() ||
        "";
      const symbol =
        (r.SYMBOL || r.Symbol || r["Security Symbol"] || "").trim().toUpperCase() ||
        Object.values(r)
          .find((v) => /^SGB/i.test(v.trim()))
          ?.trim()
          .toUpperCase() ||
        "";
      if (isin && symbol) out.push({ symbol, isin, name });
    }
    if (out.length) return out;
  }
  return [];
}

export async function ingestNsePrices(
  preferDate?: string
): Promise<{ sessionDate: string | null; count: number; error?: string }> {
  const db = getDb();
  const start = preferDate
    ? new Date(preferDate + "T00:00:00Z")
    : new Date();
  const candidates = candidateSessionDates(start, 14);

  let lastError = "no session found";
  for (const d of candidates) {
    const result = await fetchNseBhavcopy(d);
    if (!result.ok) {
      lastError = result.error ?? lastError;
      continue;
    }

    // Map symbols to ISINs via tranches table
    const bySymbol = new Map(
      (
        db
          .prepare(`SELECT isin, nse_symbol, tranche_code FROM tranches WHERE active = 1`)
          .all() as { isin: string; nse_symbol: string | null; tranche_code: string }[]
      ).flatMap((t) => {
        const entries: [string, string][] = [];
        if (t.nse_symbol) entries.push([t.nse_symbol.toUpperCase(), t.isin]);
        entries.push([t.tranche_code.toUpperCase(), t.isin]);
        return entries;
      })
    );

    // Try enriching from ISIN master
    const master = await fetchNseIsinMaster();
    for (const m of master) {
      bySymbol.set(m.symbol.toUpperCase(), m.isin);
      db.prepare(
        `INSERT INTO tranches (isin, tranche_code, nse_symbol, coupon_pa, units_per_bond, active)
         VALUES (?, ?, ?, 2.5, 1.0, 1)
         ON CONFLICT(isin) DO UPDATE SET nse_symbol = excluded.nse_symbol, updated_at = datetime('now')`
      ).run(m.isin, m.symbol, m.symbol);
    }

    const upsert = db.prepare(`
      INSERT INTO prices (isin, exchange, session_date, close, volume, source, verified, outlier)
      VALUES (?, 'NSE', ?, ?, ?, 'nse_bhavcopy', 0, 0)
      ON CONFLICT(isin, exchange, session_date) DO UPDATE SET
        close = excluded.close,
        volume = excluded.volume,
        source = excluded.source,
        fetched_at = datetime('now')
    `);

    let count = 0;
    const tx = db.transaction(() => {
      for (const row of result.rows) {
        let isin = row.isin || bySymbol.get(row.symbol);
        if (!isin) {
          // Auto-create tranche stub
          isin = `UNKNOWN-${row.symbol}`;
          db.prepare(
            `INSERT INTO tranches (isin, tranche_code, nse_symbol, coupon_pa, units_per_bond, active)
             VALUES (?, ?, ?, 2.5, 1.0, 1)
             ON CONFLICT(isin) DO NOTHING`
          ).run(isin, row.symbol, row.symbol);
          // Also try unique tranche_code conflict — skip if code exists under other isin
        }
        try {
          upsert.run(isin, result.sessionDate, row.close, row.volume);
          count++;
        } catch {
          // ignore unique conflicts on tranche_code for stubs
        }
      }
      db.prepare(
        `INSERT INTO trading_calendar (session_date, nse_ok) VALUES (?, 1)
         ON CONFLICT(session_date) DO UPDATE SET nse_ok = 1`
      ).run(result.sessionDate);
    });
    tx();
    return { sessionDate: result.sessionDate, count };
  }
  return { sessionDate: null, count: 0, error: lastError };
}
