#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
OUT="$ROOT/backups/$STAMP"
mkdir -p "$OUT"
docker compose -f "$ROOT/docker-compose.yml" exec -T postgres pg_dump -U paic paic > "$OUT/postgres.sql"
echo "Backup written to $OUT"
