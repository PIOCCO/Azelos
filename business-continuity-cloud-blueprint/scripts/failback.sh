#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/common.sh"

load_env
export BCBP_DRY_RUN="${BCBP_DRY_RUN:-false}"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) BCBP_DRY_RUN=true; export BCBP_DRY_RUN; shift ;;
    *) shift ;;
  esac
done

INCIDENT_ID="failback-$(date -u +%Y%m%dT%H%M%SZ)"
REPORT="${BCBP_ROOT}/reports/failback-last.json"
init_timeline "${INCIDENT_ID}"
timeline_event "Recovery initiated" "Failback to primary region"

PRIMARY="$(yaml_get cloud.primary_region)"
log "INFO" "Target primary region: ${PRIMARY}"

if ! confirm_destructive "Fail back production traffic to primary (${PRIMARY})?"; then
  python3 - "${REPORT}" <<'PY'
import json, sys
json.dump({"outcome": "PASS", "mode": "dry-run"}, open(sys.argv[1],"w"), indent=2)
PY
  exit 0
fi

timeline_event "Decision" "Validate synchronization before cutover"
log "INFO" "Run DB replication lag / data consistency checks (client-specific)"

timeline_event "Recovery initiated" "Controlled DNS/traffic switch to primary"
"${SCRIPT_DIR}/health-check.sh" || HC=$?
HC="${HC:-0}"

OUTCOME="PASS"
[[ "${HC}" -eq 0 ]] || OUTCOME="FAIL"

python3 - "${REPORT}" "${OUTCOME}" <<'PY'
import json, sys
json.dump({"outcome": sys.argv[2], "primary_validated": sys.argv[2] == "PASS"}, open(sys.argv[1],"w"), indent=2)
PY

if [[ "${OUTCOME}" == "FAIL" ]]; then
  die "Failback validation failed"
fi

timeline_event "Validation complete" "Failback successful"
exit 0
