#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/common.sh"
load_env

VERSION="${1:-$(git -C "${WHBP_ROOT}" rev-parse --short HEAD 2>/dev/null || date -u +%Y%m%d%H%M%S)}"
REPORT="${WHBP_REPORT_DIR}/deploy-${VERSION}.json"
mkdir -p "${WHBP_REPORT_DIR}"

log "Validate configuration"
validate_config || die "Configuration validation failed"

python3 - "${WHBP_CLIENT_CONFIG}" <<'PY' || die "Environment guard failed"
import os
import sys
from pathlib import Path
from automation.whbp.config_loader import load_yaml
from automation.whbp.paths import repo_root
p = Path(sys.argv[1])
if not p.is_absolute():
    p = repo_root() / p
cfg = load_yaml(p)
env_type = cfg.get("environment", {}).get("type")
if env_type == "production" and not os.environ.get("WHBP_PRODUCTION_APPROVED"):
    print("Production requires WHBP_PRODUCTION_APPROVED=true or manual workflow approval", file=sys.stderr)
    sys.exit(2)
if env_type in ("production", "staging") and cfg.get("database", {}).get("enabled"):
    pw = os.environ.get("WHBP_POSTGRES_PASSWORD", "")
    if not pw or pw in ("devpass", "changeme", "password"):
        print("Set a strong WHBP_POSTGRES_PASSWORD for staging/production (not dev defaults)", file=sys.stderr)
        sys.exit(2)
if cfg.get("redis", {}).get("enabled") and env_type in ("production", "staging"):
    rp = os.environ.get("WHBP_REDIS_PASSWORD", "")
    if not rp or rp in ("devredis", "changeme", "password"):
        print("Set a strong WHBP_REDIS_PASSWORD for staging/production", file=sys.stderr)
        sys.exit(2)
PY

GEN="$(render_stack)"
COMPOSE="${GEN}/docker-compose.yml"
[[ -f "${COMPOSE}" ]] || die "Render failed"

# Merge secrets for compose (never log contents)
DEPLOY_ENV="${GEN}/.env.deploy"
{
  echo "WHBP_CLIENT_ID=$(python3 -c "import yaml;print(yaml.safe_load(open('${WHBP_CLIENT_CONFIG}'))['client']['id'])")"
  echo "WHBP_ENV=$(python3 -c "import yaml;print(yaml.safe_load(open('${WHBP_CLIENT_CONFIG}'))['environment']['type'])")"
  echo "POSTGRES_DB=${POSTGRES_DB:-appdb}"
  echo "POSTGRES_USER=${POSTGRES_USER:-appuser}"
  echo "POSTGRES_PASSWORD=${WHBP_POSTGRES_PASSWORD:-devpass}"
  echo "REDIS_PASSWORD=${WHBP_REDIS_PASSWORD:-devredis}"
} > "${DEPLOY_ENV}"

if [[ -f "${WHBP_ROOT}/security/scanning/scan-images.sh" ]] && [[ "${WHBP_SKIP_SECURITY:-false}" != "true" ]]; then
  log "Security checks (configurable)"
  bash "${WHBP_ROOT}/security/scanning/scan-images.sh" "${GEN}" || die "Security scan failed"
fi

if [[ "${WHBP_DRY_RUN}" == "true" ]]; then
  log "DRY RUN: docker compose config"
  docker compose -f "${COMPOSE}" --env-file "${DEPLOY_ENV}" config >/dev/null
  exit 0
fi

log "Build and deploy version ${VERSION}"
export COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-whbp-$(basename "${GEN}")}"

# Save previous image IDs for rollback
docker compose -f "${COMPOSE}" --env-file "${DEPLOY_ENV}" images --quiet > "${GEN}/.previous-images" 2>/dev/null || true

docker compose -f "${COMPOSE}" --env-file "${DEPLOY_ENV}" build
docker compose -f "${COMPOSE}" --env-file "${DEPLOY_ENV}" up -d --remove-orphans

sleep 3
if ! WHBP_CLIENT_CONFIG="${WHBP_CLIENT_CONFIG}" bash "${SCRIPT_DIR}/health-check.sh"; then
  log "Health check failed — rolling back"
  WHBP_EXIT_CODE=2 bash "${SCRIPT_DIR}/rollback.sh" previous --yes || true
  die "Deployment failed health checks"
fi

record_deployment "${VERSION}"
python3 - "${REPORT}" "${VERSION}" "${GEN}" <<'PY'
import json, sys
json.dump({"outcome": "SUCCESS", "version": sys.argv[2], "generated": sys.argv[3]}, open(sys.argv[1], "w"), indent=2)
PY

python3 "${WHBP_ROOT}/automation/whbp/export_inventory.py" --config "${WHBP_CLIENT_CONFIG}" || true
log "Deployment successful: ${VERSION}"
exit 0
