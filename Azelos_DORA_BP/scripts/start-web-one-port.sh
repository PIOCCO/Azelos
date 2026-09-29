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
if [[ ! -d node_modules ]]; then npm install; fi
npm run build

echo ""
echo "Open in browser:  http://127.0.0.1:8000"
echo "Login: admin@demo.bank / ChangeMeNow!"
echo ""

cd "$BACKEND"
export SERVE_FRONTEND=1
exec $UV app.main:app --host 0.0.0.0 --port 8000
