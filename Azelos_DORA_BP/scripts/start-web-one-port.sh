#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

if ! nc -z 127.0.0.1 5432 2>/dev/null && ! nc -z 127.0.0.1 5433 2>/dev/null; then
  echo "ERROR: PostgreSQL not running on 5432 or 5433."
  echo "Run: cd $ROOT && docker compose up -d postgres"
  exit 1
fi

if [[ ! -f "$BACKEND/.env" ]]; then
  cp "$ROOT/.env.example" "$BACKEND/.env"
  if nc -z 127.0.0.1 5432 2>/dev/null && ! nc -z 127.0.0.1 5433 2>/dev/null; then
    sed -i 's/127.0.0.1:5433/127.0.0.1:5432/' "$BACKEND/.env" 2>/dev/null || \
      sed -i '' 's/127.0.0.1:5433/127.0.0.1:5432/' "$BACKEND/.env"
  fi
fi

cd "$BACKEND"
if [[ -d .venv ]]; then PY=".venv/bin/python"; UV=".venv/bin/uvicorn"; else PY=python3; UV=uvicorn; fi
$PY -m pip install -q -e ".[dev]" 2>/dev/null || true
$PY -m alembic upgrade head
$PY scripts/seed_dev.py 2>/dev/null || true
$PY scripts/seed_api_user.py 2>/dev/null || true

cd "$FRONTEND"
echo "Installing frontend dependencies (includes lucide-react icons)…"
if [[ -f package-lock.json ]]; then npm ci || npm install; else npm install; fi
npm run build

if [[ ! -f dist/index.html ]]; then
  echo "ERROR: frontend build did not produce dist/index.html"
  exit 1
fi

cd "$BACKEND"
echo ""
echo "=============================================="
echo "  Starting server — http://127.0.0.1:8000"
echo "  Login: admin@demo.bank / ChangeMeNow!"
echo ""
echo "  IMPORTANT: Keep this terminal OPEN."
echo "  Closing it stops the site (ERR_CONNECTION_REFUSED)."
echo "=============================================="
echo ""

export SERVE_FRONTEND=1
exec $UV app.main:app --host 127.0.0.1 --port 8000
