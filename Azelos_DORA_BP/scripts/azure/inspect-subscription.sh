#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "${SCRIPT_DIR}/common.sh"

require_cmd az
require_azure_session
print_azure_context
ensure_providers
list_dora_resource_groups

echo ""
echo "=== Terraform remote state (if bootstrap applied) ==="
if bootstrap_state_exists; then
  echo "Found ${PROJECT_NAME}-tfstate-rg"
  az storage account list -g "${PROJECT_NAME}-tfstate-rg" --query "[].{name:name, location:location}" -o table 2>/dev/null || true
else
  echo "No ${PROJECT_NAME}-tfstate-rg — bootstrap not applied yet."
fi

echo ""
echo "=== Dev platform RG (if deployed) ==="
if az group show -n "${PROJECT_NAME}-dev-rg" -o none 2>/dev/null; then
  az resource list -g "${PROJECT_NAME}-dev-rg" --query "[].{name:name, type:type}" -o table
else
  echo "No ${PROJECT_NAME}-dev-rg — dev environment not deployed yet."
fi
