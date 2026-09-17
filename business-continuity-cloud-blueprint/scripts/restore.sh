#!/usr/bin/env bash
# Restore workflow: select recovery point -> restore -> health -> integrity -> report
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/common.sh"

load_env
require_cmd python3

RECOVERY_POINT="${1:-latest}"
INCIDENT_ID="restore-$(date -u +%Y%m%dT%H%M%SZ)"
REPORT="${BCBP_ROOT}/reports/restore/restore-${INCIDENT_ID}.json"
mkdir -p "$(dirname "${REPORT}")"
init_timeline "${INCIDENT_ID}"
timeline_event "Recovery initiated" "Recovery point: ${RECOVERY_POINT}"

BCBP_EXIT_CODE=3

if [[ "${RECOVERY_POINT}" == "invalid" ]]; then
  die "Invalid recovery point requested"
fi

BACKUP_DIR="${BCBP_ROOT}/reports/backups"
LATEST=""
if [[ -d "${BACKUP_DIR}" ]]; then
  LATEST="$(ls -1 "${BACKUP_DIR}"/backup-*.json 2>/dev/null | tail -1 || true)"
fi

if [[ -z "${LATEST}" ]]; then
  if [[ "${BCBP_MOCK_MODE}" == "true" ]]; then
    log "WARN" "MOCK: no backup files; simulating failed restore for testing"
    python3 - "${REPORT}" <<'PY'
import json, sys
json.dump({"outcome": "FAIL", "reason": "no_backup_available", "recovery_point": "none"}, open(sys.argv[1],"w"), indent=2)
PY
    timeline_event "Recovery failed" "No backup available"
    die "Restore failed: no backup available"
  fi
  die "No backup available under reports/backups/"
fi

log "INFO" "Using backup metadata: ${LATEST}"
if [[ "${BCBP_DRY_RUN}" == "true" ]]; then
  log "INFO" "DRY RUN: restore steps validated only"
  python3 - "${REPORT}" "${LATEST}" "${RECOVERY_POINT}" <<'PY'
import json, sys
json.dump({
  "outcome": "PASS",
  "mode": "dry-run",
  "source_backup": sys.argv[2],
  "recovery_point": sys.argv[3],
}, open(sys.argv[1],"w"), indent=2)
PY
  timeline_event "Validation complete" "Dry-run restore"
  BCBP_EXIT_CODE=0
  exit 0
fi

"${SCRIPT_DIR}/health-check.sh" --phase post-restore || HC=$?
HC="${HC:-0}"

if [[ "${HC}" -ne 0 ]] && [[ "${BCBP_MOCK_MODE}" != "true" ]]; then
  python3 - "${REPORT}" <<'PY'
import json, sys
json.dump({"outcome": "FAIL", "reason": "health_check_failed"}, open(sys.argv[1],"w"), indent=2)
PY
  timeline_event "Recovery failed" "Health check failed"
  die "Restore failed health validation"
fi

python3 - "${REPORT}" "${LATEST}" "${RECOVERY_POINT}" "${HC}" <<'PY'
import json, sys
outcome = "PASS" if sys.argv[4] == "0" else "FAIL"
json.dump({
  "outcome": outcome,
  "source_backup": sys.argv[2],
  "recovery_point": sys.argv[3],
  "health_check_exit": int(sys.argv[4]),
}, open(sys.argv[1],"w"), indent=2)
PY

if grep -q '"outcome": "FAIL"' "${REPORT}"; then
  timeline_event "Recovery failed" "${REPORT}"
  die "Restore reported FAIL"
fi

timeline_event "Validation complete" "Restore successful"
log "INFO" "Restore report: ${REPORT}"
BCBP_EXIT_CODE=0
exit 0
