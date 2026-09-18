#!/usr/bin/env bash
set -euo pipefail
WHBP_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
source "${WHBP_ROOT}/deployment/lib/common.sh"
load_env
DUMP="${1:?dump file required}"
GEN="$(render_stack)"
docker compose -f "${GEN}/docker-compose.yml" exec -T postgres psql -U "${POSTGRES_USER:-appuser}" -d "${POSTGRES_DB:-appdb}" < "${DUMP}"
echo "Restore completed"
