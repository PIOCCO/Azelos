#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/common.sh"

load_env
require_cmd terraform

ENV_NAME="${1:-${BCBP_ENV:-dev}}"
TF_DIR="${BCBP_ROOT}/terraform/environments/${ENV_NAME}"
[[ -d "${TF_DIR}" ]] || die "Unknown environment: ${ENV_NAME}"

BCBP_DRY_RUN="${BCBP_DRY_RUN:-false}"
confirm_destructive "Destroy ALL infrastructure in ${ENV_NAME}?" || exit 0

cd "${TF_DIR}"
terraform init -input=false
if [[ "${BCBP_DRY_RUN}" == "true" ]]; then
  terraform plan -destroy -input=false
  exit 0
fi
terraform destroy -input=false -auto-approve
log "INFO" "Destroy complete"
exit 0
