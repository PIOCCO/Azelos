#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/common.sh"

load_env
require_cmd python3

INCIDENT_ID="backup-$(date -u +%Y%m%dT%H%M%SZ)"
init_timeline "${INCIDENT_ID}"
timeline_event "Backup initiated" "Scheduled/on-demand backup"

ENV_NAME="${BCBP_ENV:-dev}"
TF_DIR="${BCBP_ROOT}/terraform/environments/${ENV_NAME}"
RSV=""
STORAGE=""
if [[ -d "${TF_DIR}/.terraform" ]] || [[ -f "${TF_DIR}/terraform.tfstate" ]]; then
  RSV="$(terraform -chdir="${TF_DIR}" output -raw recovery_vault_name 2>/dev/null || true)"
  STORAGE="$(terraform -chdir="${TF_DIR}" output -raw storage_account_name 2>/dev/null || true)"
fi

REPORT="${BCBP_ROOT}/reports/backups/backup-$(date -u +%Y%m%dT%H%M%SZ).json"
mkdir -p "$(dirname "${REPORT}")"

if ! azure_ready; then
  if [[ "${BCBP_MOCK_MODE}" == "true" ]]; then
    log "WARN" "MOCK MODE: simulating backup"
    python3 "${BCBP_ROOT}/automation/bcdr/backup_infra.py" \
      --client "${BCBP_CLIENT_CONFIG}" \
      --report "${REPORT}" \
      --vault "${RSV}" \
      --storage "${STORAGE}"
    timeline_event "Backup completed" "Mock report ${REPORT}"
    exit 0
  fi
  die "Azure credentials not available (az login) or set BCBP_MOCK_MODE=true"
fi

require_cmd az
python3 "${BCBP_ROOT}/automation/bcdr/backup_infra.py" \
  --client "${BCBP_CLIENT_CONFIG}" \
  --report "${REPORT}" \
  --vault "${RSV}" \
  --storage "${STORAGE}"

timeline_event "Backup completed" "Report: ${REPORT}"
log "INFO" "Backup finished: ${REPORT}"
exit 0
