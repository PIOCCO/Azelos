#!/usr/bin/env bash
# Shared helpers for Azure deploy scripts (no secrets printed).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TF_BOOTSTRAP="${ROOT}/infra/terraform/bootstrap"
TF_DEV="${ROOT}/infra/terraform/environments/dev"
PROJECT_NAME="${PROJECT_NAME:-dora-bp}"

require_cmd() {
  for c in "$@"; do
    command -v "$c" >/dev/null 2>&1 || {
      echo "Missing required command: $c" >&2
      exit 1
    }
  done
}

require_azure_session() {
  if ! az account show -o none 2>/dev/null; then
    echo "No active Azure CLI session in this environment." >&2
    echo "Run: az login   (or az login --use-device-code in Cloud Agent)" >&2
    exit 1
  fi
}

print_azure_context() {
  echo "=== Azure context (non-secret) ==="
  az account show --query "{subscriptionId:id, subscriptionName:name, tenantId:tenantId, user:user.name}" -o table
}

list_dora_resource_groups() {
  echo "=== Resource groups matching '${PROJECT_NAME}' ==="
  az group list --query "[?contains(name, '${PROJECT_NAME}')].{name:name, location:location, state:properties.provisioningState}" -o table
}

ensure_providers() {
  local providers=(
    Microsoft.App
    Microsoft.ContainerRegistry
    Microsoft.DBforPostgreSQL
    Microsoft.KeyVault
    Microsoft.Network
    Microsoft.OperationalInsights
    Microsoft.Storage
  )
  echo "=== Resource provider registration ==="
  for ns in "${providers[@]}"; do
    state="$(az provider show -n "$ns" --query registrationState -o tsv 2>/dev/null || echo unknown)"
    echo "$ns: $state"
    if [[ "$state" == "NotRegistered" ]]; then
      echo "Registering $ns ..."
      az provider register -n "$ns" --wait
    fi
  done
}

bootstrap_state_exists() {
  az group show -n "${PROJECT_NAME}-tfstate-rg" -o none 2>/dev/null
}

write_backend_hcl_from_bootstrap() {
  local backend_file="${TF_DEV}/backend.hcl"
  if [[ -f "$backend_file" ]]; then
    echo "backend.hcl already exists — not overwriting."
    return 0
  fi
  if [[ ! -d "${TF_BOOTSTRAP}/.terraform" ]]; then
    echo "Bootstrap not initialized; run bootstrap first." >&2
    return 1
  fi
  local rg sa container
  rg="$(terraform -chdir="$TF_BOOTSTRAP" output -raw resource_group_name 2>/dev/null || true)"
  sa="$(terraform -chdir="$TF_BOOTSTRAP" output -raw storage_account_name 2>/dev/null || true)"
  container="$(terraform -chdir="$TF_BOOTSTRAP" output -raw container_name 2>/dev/null || true)"
  if [[ -z "$rg" || -z "$sa" || -z "$container" ]]; then
    echo "Bootstrap outputs missing — apply bootstrap or create backend.hcl manually from backend.hcl.example" >&2
    return 1
  fi
  cat >"$backend_file" <<EOF
resource_group_name  = "${rg}"
storage_account_name = "${sa}"
container_name       = "${container}"
key                  = "dev.terraform.tfstate"
EOF
  echo "Wrote ${backend_file} from bootstrap outputs."
}

ensure_tfvars() {
  local tfvars="${TF_DEV}/terraform.tfvars"
  if [[ -f "$tfvars" ]]; then
    return 0
  fi
  if [[ ! -f "${TF_DEV}/terraform.tfvars.example" ]]; then
    echo "Missing terraform.tfvars.example" >&2
    exit 1
  fi
  echo "terraform.tfvars not found."
  echo "Copy ${TF_DEV}/terraform.tfvars.example to terraform.tfvars and set container_image + cors_origins."
  exit 1
}
