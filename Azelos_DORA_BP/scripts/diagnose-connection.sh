#!/usr/bin/env bash
echo "=== DORA connection diagnose ==="
for p in 5432 5433 8000 5173; do
  if nc -z 127.0.0.1 "$p" 2>/dev/null; then
    echo "Port $p: OPEN"
  else
    echo "Port $p: CLOSED (browser will refuse if using this port)"
  fi
done
echo ""
echo -n "http://127.0.0.1:8000/health -> "
curl -s -m 3 http://127.0.0.1:8000/health || echo "FAILED"
echo ""
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [[ -f "$ROOT/frontend/dist/index.html" ]]; then
  echo "frontend/dist: OK"
else
  echo "frontend/dist: MISSING — cd frontend && npm install && npm run build"
fi
echo ""
echo "If port 8000 is CLOSED, run: $ROOT/scripts/start-web-one-port.sh"
echo "Keep that terminal OPEN while browsing http://127.0.0.1:8000"
