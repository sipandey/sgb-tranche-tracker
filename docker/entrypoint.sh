#!/bin/sh
set -e

mkdir -p "$(dirname "${SGB_DB_PATH:-/data/sgb.sqlite}")"

# Optional first-boot demo seed (useful when live NSE/BSE/IBJA are blocked)
if [ "${SGB_SEED_DEMO:-0}" = "1" ] && [ ! -f "${SGB_DB_PATH:-/data/sgb.sqlite}" ]; then
  echo "Seeding demo session into ${SGB_DB_PATH}…"
  npx tsx scripts/ingest.ts --demo || true
fi

exec "$@"
