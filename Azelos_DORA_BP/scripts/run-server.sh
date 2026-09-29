#!/usr/bin/env bash
# Start API + built UI on http://127.0.0.1:8000 (run start-web-one-port.sh first, or npm run build in frontend).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

if [[ ! -f "$FRONTEND/dist/index.html" ]]; then
  echo "ERROR: frontend/dist missing. Run first:"
  echo "  cd $FRONTEND && npm install && npm run build"
  echo "Or:  $ROOT/scripts/start-web-one-port.sh"
  exit 1
fi

if [[ ! -f "$BACKEND/.env" ]]; then
  echo "ERROR: missing backend/.env — copy from $ROOT/.env.example"
  exit 1
fi

cd "$BACKEND"
UV=".venv/bin/uvicorn"
[[ -x "$UV" ]] || UV=uvicorn

echo "=============================================="
echo "  DORA Blueprint — http://127.0.0.1:8000"
echo "  Leave this terminal OPEN while you browse."
echo "  Press Ctrl+C to stop."
echo "=============================================="

export SERVE_FRONTEND=1
exec "$UV" app.main:app --host 0.0.0.0 --port 8000
