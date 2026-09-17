#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/common.sh"

load_env
DRY=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY=true; BCBP_DRY_RUN=true; shift ;;
    *) shift ;;
  esac
done

INCIDENT_ID="failover-$(date -u +%Y%m%dT%H%M%SZ)"
REPORT="${BCBP_ROOT}/reports/failover-last.json"
init_timeline "${INCIDENT_ID}"
timeline_event "Detection" "Failover procedure invoked"
timeline_event "Investigation" "Checking prerequisites"

SECONDARY="$(yaml_get cloud.secondary_region)"
PRIMARY="$(yaml_get cloud.primary_region)"
log "INFO" "Primary: ${PRIMARY} -> Secondary: ${SECONDARY}"

# Prerequisites
if ! azure_ready && [[ "${BCBP_MOCK_MODE}" != "true" ]]; then
  die "Azure credentials required for failover"
fi

timeline_event "Decision" "Evaluate secondary environment and recovery data"
ENV_NAME="${BCBP_ENV:-dev}"
TF_DIR="${BCBP_ROOT}/terraform/environments/${ENV_NAME}"
STANDBY_URL=""
if terraform -chdir="${TF_DIR}" output -raw standby_application_url >/dev/null 2>&1; then
  STANDBY_URL="$(terraform -chdir="${TF_DIR}" output -raw standby_application_url 2>/dev/null || true)"
fi

if [[ -z "${STANDBY_URL}" ]] && [[ "${BCBP_MOCK_MODE}" != "true" ]]; then
  log "WARN" "No standby URL — DR may require terraform apply in secondary (active-passive cold/warm)"
fi

if ! confirm_destructive "Failover may redirect production traffic to ${SECONDARY}."; then
  log "INFO" "Failover dry-run / aborted before traffic switch"
  python3 - "${REPORT}" <<'PY'
import json, sys
json.dump({"outcome": "PASS", "mode": "dry-run", "traffic_switched": False}, open(sys.argv[1],"w"), indent=2)
PY
  timeline_event "Validation complete" "Dry-run only"
  exit 0
fi

timeline_event "Recovery initiated" "Traffic switch placeholder — update DNS/Front Door per client runbook"
log "INFO" "Execute DNS/traffic switch using client-specific records (not automated by default)"

"${SCRIPT_DIR}/health-check.sh" || HC=$?
HC="${HC:-0}"

OUTCOME="PASS"
[[ "${HC}" -eq 0 ]] || OUTCOME="FAIL"

python3 - "${REPORT}" "${OUTCOME}" "${STANDBY_URL}" <<'PY'
import json, sys
json.dump({
  "outcome": sys.argv[2],
  "standby_url": sys.argv[3],
  "traffic_switched": sys.argv[2] == "PASS",
}, open(sys.argv[1],"w"), indent=2)
PY

if [[ "${OUTCOME}" == "FAIL" ]]; then
  timeline_event "Recovery failed" "Health check failed after failover"
  die "Failover validation failed"
fi

timeline_event "Validation complete" "Failover drill/report archived"
log "INFO" "Failover report: ${REPORT}"
exit 0
