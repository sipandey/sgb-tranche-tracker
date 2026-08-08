import { execute, getSettings, queryOne } from "@/lib/db";
import { BROWSER_UA, fetchText, toIsoDate } from "./http";

export type GoldQuote = {
  ratePer10g: number;
  sessionDate: string;
  source: "ibja_scrape" | "ibja_api";
};

export async function fetchIbjaApi(token: string): Promise<GoldQuote | null> {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const yyyy = today.getFullYear();
  const date = `${dd}/${mm}/${yyyy}`;
  const url = `https://ibjarates.com/API/GoldRates/?ACCESS_TOKEN=${encodeURIComponent(token)}&START_DATE=${encodeURIComponent(date)}&END_DATE=${encodeURIComponent(date)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": BROWSER_UA, Accept: "application/json" },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as
    | { Purity?: string; GoldRate?: string | number; RateDate?: string }[]
    | { data?: { Purity?: string; GoldRate?: string | number; RateDate?: string }[] };
  const list = Array.isArray(json) ? json : json.data ?? [];
  const hit = list.find((r) => String(r.Purity) === "999") ?? list[0];
  if (!hit) return null;
  const rate = Number(hit.GoldRate);
  if (!Number.isFinite(rate) || rate <= 0) return null;
  return {
    ratePer10g: rate,
    sessionDate: toIsoDate(today),
    source: "ibja_api",
  };
}

export async function fetchIbjaScrape(): Promise<GoldQuote | null> {
  const { ok, text } = await fetchText("https://www.ibjarates.com/", {
    headers: { Accept: "text/html" },
  });
  if (!ok) return null;

  // Patterns seen on IBJA site: data-label="Gold 999">149020</td>
  const patterns = [
    /data-label=["']Gold\s*999["'][^>]*>([\d,]+)/i,
    /Gold\s*999[^0-9]{0,40}([\d,]{5,})/i,
    /999\s*purity[^0-9]{0,40}([\d,]{5,})/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const rate = Number(m[1].replace(/,/g, ""));
      if (Number.isFinite(rate) && rate > 1000) {
        return {
          ratePer10g: rate,
          sessionDate: toIsoDate(new Date()),
          source: "ibja_scrape",
        };
      }
    }
  }
  return null;
}

export async function ingestGoldSpot(sessionDate?: string): Promise<{
  ok: boolean;
  quote?: GoldQuote;
  error?: string;
}> {
  const settings = await getSettings();
  const token = process.env.IBJA_ACCESS_TOKEN || settings.ibja_access_token;

  let quote: GoldQuote | null = null;
  if (token) {
    quote = await fetchIbjaApi(token);
  }
  if (!quote) {
    quote = await fetchIbjaScrape();
  }
  if (!quote) {
    return { ok: false, error: "Unable to fetch IBJA 999 gold rate" };
  }

  const date = sessionDate || quote.sessionDate;
  await execute(
    `INSERT INTO gold_spot (session_date, rate_per_10g, purity, source)
     VALUES (?, ?, 999, ?)
     ON CONFLICT(session_date, source) DO UPDATE SET
       rate_per_10g = excluded.rate_per_10g,
       fetched_at = datetime('now')`,
    [date, quote.ratePer10g, quote.source]
  );

  return { ok: true, quote: { ...quote, sessionDate: date } };
}

export async function getLatestGold(sessionDate?: string): Promise<{
  rate_per_10g: number;
  session_date: string;
  source: string;
} | null> {
  if (sessionDate) {
    const row = await queryOne<{
      rate_per_10g: number;
      session_date: string;
      source: string;
    }>(
      `SELECT rate_per_10g, session_date, source FROM gold_spot
       WHERE session_date = ?
       ORDER BY CASE source WHEN 'ibja_api' THEN 0 ELSE 1 END, fetched_at DESC
       LIMIT 1`,
      [sessionDate]
    );
    if (row) {
      return {
        rate_per_10g: Number(row.rate_per_10g),
        session_date: row.session_date,
        source: row.source,
      };
    }
  }
  const latest = await queryOne<{
    rate_per_10g: number;
    session_date: string;
    source: string;
  }>(
    `SELECT rate_per_10g, session_date, source FROM gold_spot
     ORDER BY session_date DESC,
       CASE source WHEN 'ibja_api' THEN 0 ELSE 1 END,
       fetched_at DESC
     LIMIT 1`
  );
  if (!latest) return null;
  return {
    rate_per_10g: Number(latest.rate_per_10g),
    session_date: latest.session_date,
    source: latest.source,
  };
}
