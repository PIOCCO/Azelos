#!/usr/bin/env bash
# Shared helpers for Business Continuity Cloud Blueprint scripts.

set -euo pipefail

BCBP_ROOT="${BCBP_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
export PYTHONPATH="${BCBP_ROOT}:${PYTHONPATH:-}"
BCBP_CLIENT_CONFIG="${BCBP_CLIENT_CONFIG:-${BCBP_ROOT}/client.yaml}"
BCBP_LOG_DIR="${BCBP_LOG_DIR:-${BCBP_ROOT}/reports/logs}"
BCBP_DRY_RUN="${BCBP_DRY_RUN:-false}"
BCBP_MOCK_MODE="${BCBP_MOCK_MODE:-false}"

mkdir -p "${BCBP_LOG_DIR}"

log() {
  local level="$1"; shift
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] [$level] $*" | tee -a "${BCBP_LOG_DIR}/bcbp.log"
}

die() {
  log "ERROR" "$*"
  exit "${BCBP_EXIT_CODE:-1}"
}

require_cmd() {
  local cmd="$1"
  command -v "$cmd" >/dev/null 2>&1 || die "Required command not found: ${cmd}"
}

load_env() {
  if [[ -f "${BCBP_ROOT}/.env" ]]; then
    # shellcheck disable=SC1091
    set -a
    source "${BCBP_ROOT}/.env"
    set +a
  fi
}

yaml_get() {
  local key_path="$1"
  python3 - "${BCBP_CLIENT_CONFIG}" "${key_path}" <<'PY'
import sys
import yaml
path, key = sys.argv[1], sys.argv[2]
with open(path, encoding="utf-8") as f:
    data = yaml.safe_load(f) or {}
cur = data
for part in key.split("."):
    if not isinstance(cur, dict) or part not in cur:
        print("")
        sys.exit(0)
    cur = cur[part]
if cur is None:
    print("")
else:
    print(cur)
PY
}

confirm_destructive() {
  local prompt="${1:-Proceed with destructive action?}"
  if [[ "${BCBP_DRY_RUN}" == "true" ]]; then
    log "INFO" "DRY RUN: skipping confirmation and destructive steps"
    return 1
  fi
  if [[ "$(yaml_get recovery.require_confirmation)" == "False" ]] || [[ "$(yaml_get recovery.require_confirmation)" == "false" ]]; then
    log "WARN" "require_confirmation disabled in client.yaml"
  fi
  read -r -p "${prompt} Type YES to continue: " ans
  [[ "${ans}" == "YES" ]] || die "Aborted by operator (confirmation not received)"
}

azure_ready() {
  if [[ "${BCBP_MOCK_MODE}" == "true" ]]; then
    return 1
  fi
  command -v az >/dev/null 2>&1 && az account show >/dev/null 2>&1
}

init_timeline() {
  local incident_id="$1"
  export BCBP_INCIDENT_ID="${incident_id}"
  export BCBP_TIMELINE_FILE="${BCBP_ROOT}/reports/incidents/${incident_id}/timeline.json"
  mkdir -p "$(dirname "${BCBP_TIMELINE_FILE}")"
  python3 - "${BCBP_TIMELINE_FILE}" "${incident_id}" <<'PY'
import json, sys, datetime
path, iid = sys.argv[1], sys.argv[2]
doc = {
  "incident_id": iid,
  "timezone": "UTC",
  "events": [],
  "started_at_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
}
with open(path, "w", encoding="utf-8") as f:
    json.dump(doc, f, indent=2)
PY
}

timeline_event() {
  local label="$1"
  local detail="${2:-}"
  python3 - "${BCBP_TIMELINE_FILE}" "${label}" "${detail}" <<'PY'
import json, sys, datetime
path, label, detail = sys.argv[1], sys.argv[2], sys.argv[3]
with open(path, encoding="utf-8") as f:
    doc = json.load(f)
started = datetime.datetime.fromisoformat(doc["started_at_utc"].replace("Z", "+00:00"))
now = datetime.datetime.now(datetime.timezone.utc)
delta_min = int((now - started).total_seconds() // 60)
doc["events"].append({
  "offset": f"T+{delta_min:02d}",
  "label": label,
  "detail": detail,
  "timestamp_utc": now.isoformat(),
})
with open(path, "w", encoding="utf-8") as f:
    json.dump(doc, f, indent=2)
PY
}
