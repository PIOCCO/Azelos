#!/usr/bin/env bash
# Start PostgreSQL (Docker or local), API, and Vite for local development.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

if ! nc -z 127.0.0.1 5432 2>/dev/null && ! nc -z 127.0.0.1 5433 2>/dev/null; then
  echo "PostgreSQL is not reachable on 5432 or 5433."
  echo "Start it with: cd $ROOT && docker compose up -d postgres"
  echo "Or use your local Postgres and set DATABASE_URL in backend/.env"
  exit 1
fi

if [[ ! -f "$BACKEND/.env" ]]; then
  echo "Creating backend/.env from repo .env.example (adjust DATABASE_URL if needed)."
  cp "$ROOT/.env.example" "$BACKEND/.env"
  if nc -z 127.0.0.1 5432 2>/dev/null && ! nc -z 127.0.0.1 5433 2>/dev/null; then
    sed -i 's/127.0.0.1:5433/127.0.0.1:5432/' "$BACKEND/.env" 2>/dev/null || \
      sed -i '' 's/127.0.0.1:5433/127.0.0.1:5432/' "$BACKEND/.env"
  fi
fi

cd "$BACKEND"
if [[ -d .venv ]]; then PY=".venv/bin/python"; UV=".venv/bin/uvicorn"; else PY=python3; UV=uvicorn; fi
$PY -m alembic upgrade head
$PY scripts/seed_dev.py 2>/dev/null || true
$PY scripts/seed_api_user.py 2>/dev/null || true

echo "API: http://127.0.0.1:8000  |  UI: http://127.0.0.1:5173"
echo "Easier: ./scripts/start-web-one-port.sh  →  only http://127.0.0.1:8000"
echo "Press Ctrl+C to stop both."

trap 'kill 0' EXIT
$UV app.main:app --host 0.0.0.0 --port 8000 &
cd "$FRONTEND"
if [[ -f package-lock.json ]]; then npm ci; else npm install; fi
npm run dev
