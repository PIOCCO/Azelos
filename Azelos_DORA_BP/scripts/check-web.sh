#!/usr/bin/env bash
set -uo pipefail
echo "=== DORA web diagnostics ==="
for port in 5432 5433 8000 5173; do
  if nc -z 127.0.0.1 "$port" 2>/dev/null; then
    echo "OK  port $port is open"
  else
    echo "NO  port $port is closed"
  fi
done
echo ""
echo -n "API /health: "
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8000/health 2>/dev/null || echo "failed (curl)"
echo -n "Vite /: "
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:5173/ 2>/dev/null || echo "failed (curl)"
echo -n "UI on :8000 (SERVE_FRONTEND): "
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8000/ 2>/dev/null || echo "failed"
if [[ -f "$(dirname "$0")/../backend/.env" ]]; then
  echo "backend/.env exists"
else
  echo "MISSING backend/.env — copy from .env.example"
fi
if [[ -d "$(dirname "$0")/../frontend/dist" ]]; then
  echo "frontend/dist exists (one-port mode ready)"
else
  echo "frontend/dist missing — run: cd frontend && npm run build"
fi
echo "=== end ==="
