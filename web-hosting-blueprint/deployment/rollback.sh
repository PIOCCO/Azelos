#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/common.sh"
load_env

TARGET="${1:-previous}"
CONFIRM="${2:-}"

GEN="$(render_stack)"
COMPOSE="${GEN}/docker-compose.yml"
DEPLOY_ENV="${GEN}/.env.deploy"
HF="${GEN}/deployment-history.json"

[[ -f "${COMPOSE}" ]] || die "No deployment found"

if [[ "${WHBP_DRY_RUN}" == "true" ]]; then
  log "DRY RUN rollback to ${TARGET}"
  exit 0
fi

if [[ "${CONFIRM}" != "--yes" ]]; then
  read -r -p "Rollback to ${TARGET}? Type YES: " ans
  [[ "${ans}" == "YES" ]] || die "Rollback aborted"
fi

VERSION="$(python3 - "${HF}" "${TARGET}" <<'PY'
import json, sys
path, target = sys.argv[1], sys.argv[2]
try:
    data = json.load(open(path))
except FileNotFoundError:
    print("")
    sys.exit(0)
deps = data.get("deployments", [])
if target == "previous":
    print(deps[-2]["version"] if len(deps) >= 2 else "")
else:
    print(target)
PY
)"

[[ -n "${VERSION}" ]] || die "No previous version recorded — rollback requires deployment history"

log "Rolling back to version ${VERSION}"
if [[ -f "${GEN}/.previous-images" ]]; then
  docker compose -f "${COMPOSE}" --env-file "${DEPLOY_ENV}" down --remove-orphans || true
  docker compose -f "${COMPOSE}" --env-file "${DEPLOY_ENV}" up -d --remove-orphans
else
  die "Previous image metadata missing — cannot guarantee deterministic rollback"
fi

WHBP_CLIENT_CONFIG="${WHBP_CLIENT_CONFIG}" bash "${SCRIPT_DIR}/health-check.sh" || die "Rollback health check failed"
python3 - "${WHBP_ROOT}/reports/deployments/rollback-last.json" "${VERSION}" <<'PY'
import json, sys
json.dump({"outcome": "SUCCESS", "version": sys.argv[2]}, open(sys.argv[1], "w"), indent=2)
PY
log "Rollback complete"
exit 0
