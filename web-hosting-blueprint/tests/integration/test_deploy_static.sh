#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
export WHBP_ROOT="${ROOT}"
export WHBP_CLIENT_CONFIG="${ROOT}/config/clients/demo-static.yaml"
export WHBP_POSTGRES_PASSWORD=devpass
export WHBP_REDIS_PASSWORD=devredis

if ! command -v docker >/dev/null 2>&1 || ! docker info >/dev/null 2>&1; then
  echo "SKIP: docker not available"
  exit 0
fi

bash "${ROOT}/deployment/validate-config.sh"
bash "${ROOT}/deployment/deploy.sh" "test-static"
bash "${ROOT}/deployment/health-check.sh"
docker compose -f "${ROOT}/.generated/demo-static-development/docker-compose.yml" down --remove-orphans
echo "Integration static OK"
