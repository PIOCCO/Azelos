#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/common.sh"
load_env
GEN="$(render_stack)"
docker compose -f "${GEN}/docker-compose.yml" --env-file "${GEN}/.env.deploy" restart
bash "${SCRIPT_DIR}/health-check.sh"
