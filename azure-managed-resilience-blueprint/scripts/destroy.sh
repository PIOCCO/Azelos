#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TF_DIR="${ROOT}/terraform/environments/dev"

echo "This will destroy Atlas Azure Resilience DEV infrastructure in Azure."
read -r -p "Type 'destroy' to confirm: " CONFIRM
if [[ "${CONFIRM}" != "destroy" ]]; then
  echo "Aborted."
  exit 1
fi

az account show >/dev/null
SUB_ID="$(az account show --query id -o tsv)"
cd "${TF_DIR}"
terraform init -input=false
terraform destroy -auto-approve -var="subscription_id=${SUB_ID}" "$@"

echo "Destroy complete."
