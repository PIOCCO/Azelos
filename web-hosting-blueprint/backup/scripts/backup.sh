#!/usr/bin/env bash
set -euo pipefail
WHBP_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
source "${WHBP_ROOT}/deployment/lib/common.sh"
load_env
GEN="$(render_stack)"
OUT="${WHBP_ROOT}/backup/storage/backup-$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "${OUT}"

if docker compose -f "${GEN}/docker-compose.yml" ps postgres >/dev/null 2>&1; then
  docker compose -f "${GEN}/docker-compose.yml" exec -T postgres pg_dump -U "${POSTGRES_USER:-appuser}" "${POSTGRES_DB:-appdb}" > "${OUT}/database.sql"
  echo "OK" > "${OUT}/verified.txt"
else
  echo "SKIP: postgres not running" > "${OUT}/verified.txt"
fi
echo "${OUT}"
