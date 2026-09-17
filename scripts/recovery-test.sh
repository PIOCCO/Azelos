#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/common.sh"

load_env
require_cmd python3

TEST_ID="rt-$(date -u +%Y%m%dT%H%M%SZ)"
START="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
START_EPOCH="$(date -u +%s)"
REPORT="${BCBP_ROOT}/recovery-test-report.json"
FAILED=()

log "INFO" "Starting recovery test ${TEST_ID} (non-destructive to production when BCBP_MOCK_MODE=true)"

# Backup existence & freshness
BACKUP_DIR="${BCBP_ROOT}/reports/backups"
if [[ -d "${BACKUP_DIR}" ]] && ls "${BACKUP_DIR}"/backup-*.json >/dev/null 2>&1; then
  :
else
  BCBP_MOCK_MODE="${BCBP_MOCK_MODE:-true}"
  BCBP_MOCK_MODE=true BCBP_AUTO_APPLY=false "${SCRIPT_DIR}/backup.sh" || FAILED+=("backup_creation")
fi

LATEST_BACKUP="$(ls -1 "${BACKUP_DIR}"/backup-*.json 2>/dev/null | tail -1 || true)"
[[ -n "${LATEST_BACKUP}" ]] || FAILED+=("backup_existence")

# Declared RTO/RPO from client
DECL_RTO="$(yaml_get business.default_rto_minutes)"
DECL_RPO="$(yaml_get business.default_rpo_minutes)"

# Restore dry-run (requires backup report)
BCBP_DRY_RUN=true BCBP_MOCK_MODE="${BCBP_MOCK_MODE:-true}" "${SCRIPT_DIR}/restore.sh" latest && true || FAILED+=("restore_dry_run")

# Health checks
BCBP_MOCK_MODE="${BCBP_MOCK_MODE:-true}" "${SCRIPT_DIR}/health-check.sh" || FAILED+=("health_check")

END="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
END_EPOCH="$(date -u +%s)"
DURATION=$((END_EPOCH - START_EPOCH))

# Observed recovery time only when a real restore is performed — dry-run leaves null
OBSERVED_RTO="null"
OBSERVED_RPO="null"
if [[ "${BCBP_MOCK_MODE}" != "true" ]]; then
  OBSERVED_RTO="${DURATION}"
  # Recovery point would come from backup timestamp — not fabricated
  if [[ -n "${LATEST_BACKUP}" ]]; then
    OBSERVED_RPO="$(python3 - "${LATEST_BACKUP}" <<'PY'
import json, sys, datetime
doc = json.load(open(sys.argv[1]))
ts = doc.get("timestamp_utc")
if not ts:
    print("null")
else:
    now = datetime.datetime.now(datetime.timezone.utc)
    then = datetime.datetime.fromisoformat(ts.replace("Z", "+00:00"))
    print(int((now - then).total_seconds() // 60))
PY
)"
  fi
fi

OUTCOME="PASS"
[[ ${#FAILED[@]} -eq 0 ]] || OUTCOME="FAIL"

python3 - "${REPORT}" "${TEST_ID}" "${START}" "${END}" "${DURATION}" "${DECL_RTO}" "${DECL_RPO}" "${OBSERVED_RTO}" "${OBSERVED_RPO}" "${OUTCOME}" "${FAILED[*]}" "${LATEST_BACKUP}" <<'PY'
import json, sys
report_path = sys.argv[1]
failed = [f for f in sys.argv[11].split() if f]
doc = {
  "test_id": sys.argv[2],
  "start_time_utc": sys.argv[3],
  "end_time_utc": sys.argv[4],
  "duration_seconds": int(sys.argv[5]),
  "declared_rto_minutes": int(sys.argv[6]) if sys.argv[6].isdigit() else sys.argv[6],
  "observed_recovery_time_minutes": None if sys.argv[8] == "null" else int(sys.argv[8]),
  "declared_rpo_minutes": int(sys.argv[7]) if sys.argv[7].isdigit() else sys.argv[7],
  "observed_recovery_point_minutes": None if sys.argv[9] == "null" else int(sys.argv[9]),
  "outcome": sys.argv[10],
  "failed_checks": failed,
  "evidence_locations": [sys.argv[12]] if len(sys.argv) > 12 and sys.argv[12] else [],
  "summary": "Non-destructive recovery test completed" if not failed else "One or more checks failed",
  "note": "observed_* is null in mock/dry-run — not fabricated",
}
json.dump(doc, open(report_path, "w"), indent=2)
PY

log "INFO" "Recovery test report: ${REPORT}"
[[ "${OUTCOME}" == "PASS" ]] || exit 1
exit 0
