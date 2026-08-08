# SGB Tranche Tracker

Single-user Next.js app that tracks actively traded Sovereign Gold Bond (SGB) tranches on NSE/BSE against IBJA 999 fair value, with rules-based buy/hold/switch logic for the secondary market (RBI stopped new issuance).

**Not investment advice.** Gold CAGR and tax rates are explicit user inputs.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- **LibSQL / Turso** (local `file:` DB in dev; remote Turso on Vercel)
- Ingest: NSE bhavcopy + BSE UDiFF, IBJA scrape or paid API

## Quick start (local)

```bash
npm install
npm run ingest:demo
npm run dev            # http://localhost:3000
```

Uses a local SQLite file at `data/sgb.sqlite` when Turso env vars are unset.

## Environment

| Variable | Purpose |
|----------|---------|
| `TURSO_DATABASE_URL` | Turso/libSQL URL (`libsql://…`) — **required on Vercel** |
| `TURSO_AUTH_TOKEN` | Turso auth token — **required on Vercel** |
| `SGB_DB_PATH` | Local file path when not using Turso (default `data/sgb.sqlite`) |
| `IBJA_ACCESS_TOKEN` | Optional official IBJA gold API token |
| `PORT` | Listen port for `npm start` / Docker |

Copy `.env.example` → `.env.local` for local overrides.

---

## Free cloud deploy: Vercel + Turso

### A. Create a free Turso database

1. Install the CLI (once):
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   ```
2. Sign up / log in:
   ```bash
   turso auth login
   ```
3. Create a DB (free tier):
   ```bash
   turso db create sgb-tracker
   ```
4. Copy the URL:
   ```bash
   turso db show sgb-tracker --url
   ```
5. Create a token:
   ```bash
   turso db tokens create sgb-tracker
   ```
   Save the URL and token — you need both in Vercel.

### B. Deploy on Vercel (Hobby / free)

1. Push this branch / merge to GitHub (`sipandey/sgb-tranche-tracker`).
2. Go to [https://vercel.com/new](https://vercel.com/new) → **Import** the GitHub repo.
3. Framework: **Next.js** (auto-detected). Leave build as default (`next build`).
4. **Environment Variables** → add:

   | Name | Value |
   |------|--------|
   | `TURSO_DATABASE_URL` | `libsql://…` from `turso db show` |
   | `TURSO_AUTH_TOKEN` | token from `turso db tokens create` |
   | `IBJA_ACCESS_TOKEN` | optional |

5. Click **Deploy**. Wait for the build to finish.
6. Open the `*.vercel.app` URL.

### C. First-run smoke test

1. Homepage should load **SGB Tracker** (auto-seeds demo data if the DB is empty / live feeds fail).
2. Open a tranche from the discount ranking.
3. **Settings → Run ingest now** (may use demo fallback if NSE/BSE/IBJA are blocked from Vercel’s region).
4. **Positions → Add lot** → confirm it persists after refresh (proves Turso writes work).
5. Check **Buy log**.

Schema + tranche seed run automatically on first DB connection.

### Optional: point local dev at Turso

```bash
# .env.local
TURSO_DATABASE_URL=libsql://…
TURSO_AUTH_TOKEN=…
npm run dev
```

---

## Paid / self-host alternatives (Docker)

`Dockerfile`, `railway.toml`, and `render.yaml` remain for hosts with a persistent disk. Prefer **Vercel + Turso** for the free path.

```bash
docker compose up --build   # local Docker parity
```

## Features

- Discount ranking across active tranches (verified when NSE and BSE agree)
- Per-tranche YTM / projected redemption across user CAGR scenarios
- Positions with cost basis, unrealized P/L, XIRR pre/post CG tax
- Buy-pattern action log and threshold alerts
- Dry-powder sizing rules (trickle / buy / strong buy; skip premiums)

## Tax note (Budget 2026)

From 1 April 2026, capital gains exemption on maturity applies only to original subscribers who held continuously. Secondary-market purchases are taxed on the **gain portion**; coupons remain income. The app applies your entered CG rate — it does not hardcode tax advice.

## Scripts

```bash
npm run test:calc
npm run ingest:demo
npm run ingest
npm run worker
npm run lint
npm run build
```
