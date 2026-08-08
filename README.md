# SGB Tranche Tracker

Single-user Next.js app that tracks actively traded Sovereign Gold Bond (SGB) tranches on NSE/BSE against IBJA 999 fair value, with rules-based buy/hold/switch logic for the secondary market (RBI stopped new issuance).

**Not investment advice.** Gold CAGR and tax rates are explicit user inputs.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- SQLite via `better-sqlite3` (`data/sgb.sqlite`)
- Ingest: NSE bhavcopy + BSE UDiFF, IBJA scrape or paid API

## Quick start

```bash
npm install
npm run ingest:demo    # seed a demo session if live feeds are blocked
npm run dev            # http://localhost:3000
```

Live ingest (server-side; needs outbound access to NSE/BSE/IBJA):

```bash
npm run ingest
# or from the Settings page: "Run ingest now"
```

Optional weekday worker (18:30 IST / 13:00 UTC Mon–Fri):

```bash
npm run worker
```

## Environment

| Variable | Purpose |
|----------|---------|
| `IBJA_ACCESS_TOKEN` | Official IBJA gold rates API (preferred over scrape) |
| `SGB_DB_PATH` | Override SQLite path (default `data/sgb.sqlite`) |

You can also paste the IBJA token in **Settings**.

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
npm run lint
npm run build
```
