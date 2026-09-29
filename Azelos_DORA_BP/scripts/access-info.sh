#!/usr/bin/env bash
# Print how to reach DORA from THIS machine vs your laptop (SSH tunnel).
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=============================================="
echo "  DORA Blueprint — access checklist"
echo "=============================================="
echo ""

# Postgres
if nc -z 127.0.0.1 5433 2>/dev/null; then
  echo "[OK] Postgres on 5433 (Docker)"
  PG_HINT="5433"
elif nc -z 127.0.0.1 5432 2>/dev/null; then
  echo "[OK] Postgres on 5432 (local)"
  PG_HINT="5432"
else
  echo "[!!] Postgres NOT running — start: docker compose up -d postgres"
  PG_HINT="?"
fi

ENV_FILE="$ROOT/backend/.env"
if [[ -f "$ENV_FILE" ]] && [[ "$PG_HINT" != "?" ]]; then
  if grep -q "127.0.0.1:$PG_HINT" "$ENV_FILE" 2>/dev/null; then
    echo "[OK] backend/.env DATABASE_URL port matches Postgres ($PG_HINT)"
  else
    echo "[!!] backend/.env may wrong port — use 127.0.0.1:$PG_HINT in DATABASE_URL"
  fi
else
  echo "[!!] Missing backend/.env — cp .env.example backend/.env"
fi

if [[ -f "$ROOT/frontend/dist/index.html" ]]; then
  echo "[OK] frontend/dist built"
else
  echo "[!!] Run: cd frontend && npm install && npm run build"
fi

echo ""
if nc -z 127.0.0.1 8000 2>/dev/null; then
  echo "[OK] Something listening on port 8000 on THIS machine"
  curl -s -m 2 http://127.0.0.1:8000/health && echo "" || echo "[!!] /health failed"
  if curl -s -m 2 http://127.0.0.1:8000/ | head -1 | grep -qi doctype; then
    echo "[OK] GET / returns HTML (UI mounted)"
  else
    echo "[!!] GET / is not HTML — rebuild frontend or SERVE_FRONTEND=1"
  fi
else
  echo "[!!] Port 8000 CLOSED on THIS machine — start server:"
  echo "     cd $ROOT && ./scripts/run-server.sh"
  echo "     (or ./scripts/start-web-one-port.sh)"
fi

HOST_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
SSH_USER="$(whoami)"
HOST_NAME="$(hostname -f 2>/dev/null || hostname)"

echo ""
echo "----------------------------------------------"
echo "WHERE IS YOUR BROWSER?"
echo "----------------------------------------------"
echo ""
echo "A) Browser on THIS same machine ($HOST_NAME):"
echo "     http://127.0.0.1:8000"
echo "     http://localhost:8000"
echo ""
echo "B) Browser on your LAPTOP, server runs HERE (SSH lab):"
echo "     localhost:8000 on the laptop is NOT this server."
echo "     On your LAPTOP, open a terminal and run (keep open):"
echo ""
echo "     ssh -N -L 8000:127.0.0.1:8000 ${SSH_USER}@${HOST_NAME}"
if [[ -n "$HOST_IP" ]]; then
  echo "     # or: ssh -N -L 8000:127.0.0.1:8000 ${SSH_USER}@${HOST_IP}"
fi
echo ""
echo "     Then on the laptop browser: http://localhost:8000"
echo ""
echo "C) Browser on LAN (no SSH) — firewall must allow 8000:"
if [[ -n "$HOST_IP" ]]; then
  echo "     http://${HOST_IP}:8000"
else
  echo "     http://<this-server-ip>:8000"
fi
echo ""
echo "Login: admin@demo.bank / ChangeMeNow!"
echo "=============================================="
