#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

load_env
require_cmd terraform
require_cmd python3

ENV_NAME="${1:-${BCBP_ENV:-dev}}"
TF_DIR="${BCBP_ROOT}/terraform/environments/${ENV_NAME}"

[[ -d "${TF_DIR}" ]] || die "Unknown environment: ${ENV_NAME}"

log "INFO" "Rendering tfvars from client.yaml"
python3 "${BCBP_ROOT}/automation/bcdr/render_tfvars.py" \
  --client "${BCBP_CLIENT_CONFIG}" \
  --environment "${ENV_NAME}" \
  --output "${TF_DIR}/terraform.tfvars"

cd "${TF_DIR}"
terraform fmt -recursive
terraform init -input=false

if [[ "${BCBP_DRY_RUN}" == "true" ]]; then
  terraform plan -input=false -out=tfplan
  log "INFO" "DRY RUN complete (plan saved as tfplan)"
  exit 0
fi

terraform plan -input=false -out=tfplan
if [[ "${BCBP_AUTO_APPLY:-false}" == "true" ]]; then
  terraform apply -input=false tfplan
else
  log "INFO" "Review tfplan and run: terraform apply tfplan"
fi

log "INFO" "Deploy script finished"
exit 0
