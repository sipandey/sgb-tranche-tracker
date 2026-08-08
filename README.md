# SGB Tranche Tracker

Single-user Next.js app that tracks actively traded Sovereign Gold Bond (SGB) tranches on NSE/BSE against IBJA 999 fair value, with rules-based buy/hold/switch logic for the secondary market (RBI stopped new issuance).

**Not investment advice.** Gold CAGR and tax rates are explicit user inputs.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- SQLite via `better-sqlite3` (file DB — needs a **persistent disk** in cloud)
- Ingest: NSE bhavcopy + BSE UDiFF, IBJA scrape or paid API
- Docker image + Railway / Render blueprints included

## Quick start (local)

```bash
npm install
npm run ingest:demo    # seed a demo session if live feeds are blocked
npm run dev            # http://localhost:3000
```

Or with Docker Compose:

```bash
docker compose up --build
# open http://localhost:3000
```

## Environment

| Variable | Purpose |
|----------|---------|
| `PORT` | Listen port (default `3000`; cloud hosts set this) |
| `SGB_DB_PATH` | SQLite path (use `/data/sgb.sqlite` on cloud volumes) |
| `SGB_SEED_DEMO` | Set `1` to seed demo data on first boot if DB file missing |
| `IBJA_ACCESS_TOKEN` | Official IBJA gold rates API (preferred over scrape) |

You can also paste the IBJA token in **Settings**.

---

## Deploy to Railway (recommended)

SQLite needs a persistent volume. Do **not** use a serverless-only host without a disk.

### Exact steps

1. Push this branch to GitHub (already on `cursor/sgb-tranche-tracker-c0c9` / merge to `main` if you prefer).
2. Go to [https://railway.app](https://railway.app) → **Login** → **New Project**.
3. Choose **Deploy from GitHub repo** → select `sipandey/sgb-tranche-tracker`.
4. Pick branch `main` (or `cursor/sgb-tranche-tracker-c0c9`).
5. Railway should detect `Dockerfile` / `railway.toml`. If prompted for builder, choose **Dockerfile**.
6. Open the service → **Variables** and set:

   | Name | Value |
   |------|--------|
   | `PORT` | `3000` |
   | `SGB_DB_PATH` | `/data/sgb.sqlite` |
   | `SGB_SEED_DEMO` | `1` |
   | `IBJA_ACCESS_TOKEN` | *(optional)* your token |

7. Attach a volume (required):
   - Service → **Settings** → **Volumes** → **Add Volume**
   - Mount path: `/data`
   - Size: `1 GB` is enough
8. **Settings** → **Networking** → **Generate Domain** (gives a `*.up.railway.app` URL).
9. Wait for the deploy to finish (Build → Deploy green).
10. Open the public URL → you should see **SGB Tracker** with a demo or live session.
11. In-app smoke test:
    - Dashboard ranking loads
    - Open a tranche detail row
    - **Settings → Run ingest now**
    - **Positions → Add lot**
    - Check **Buy log**

Optional one-off shell ingest (Railway → service → shell if available):

```bash
npm run ingest
# or
npm run ingest:demo
```

---

## Deploy to Render

1. Go to [https://dashboard.render.com](https://dashboard.render.com) → **New** → **Blueprint**.
2. Connect GitHub → select `sipandey/sgb-tranche-tracker`.
3. Render reads `render.yaml` (Docker web service + `/data` disk).
4. Apply the blueprint. When asked, you may set `IBJA_ACCESS_TOKEN` (optional).
5. After deploy, open the `*.onrender.com` URL.
6. Same in-app smoke test as Railway (dashboard → tranche → ingest → positions).

Manual alternative (no Blueprint): **New Web Service** → Docker → repo → set env vars above → add **Persistent Disk** mount `/data` size 1 GB.

---

## Deploy with plain Docker (any VPS)

```bash
git clone https://github.com/sipandey/sgb-tranche-tracker.git
cd sgb-tranche-tracker
docker build -t sgb-tracker .
docker run -d --name sgb \
  -p 3000:3000 \
  -e PORT=3000 \
  -e SGB_DB_PATH=/data/sgb.sqlite \
  -e SGB_SEED_DEMO=1 \
  -v sgb-data:/data \
  sgb-tracker
```

Open `http://YOUR_SERVER_IP:3000`.

---

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
npm run test:calc      # unit checks for fair value / YTM / XIRR / rules
npm run ingest:demo    # force demo session
npm run worker         # weekday scheduled ingest
npm run lint
npm run build
```

## Why not Vercel (as configured)

This app stores state in a local SQLite file. Vercel’s serverless filesystem is ephemeral. Use Railway, Render, Fly, or a VPS with a volume — or later migrate the DB to Turso/libSQL if you want serverless.
