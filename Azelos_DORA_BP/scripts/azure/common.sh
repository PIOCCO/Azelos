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

try_az_login_from_env() {
  if az account show -o none 2>/dev/null; then
    return 0
  fi
  local client_id="${AZURE_CLIENT_ID:-${ARM_CLIENT_ID:-}}"
  local client_secret="${AZURE_CLIENT_SECRET:-${ARM_CLIENT_SECRET:-}}"
  local tenant_id="${AZURE_TENANT_ID:-${ARM_TENANT_ID:-}}"
  local subscription_id="${AZURE_SUBSCRIPTION_ID:-${ARM_SUBSCRIPTION_ID:-}}"
  if [[ -z "$client_id" || -z "$client_secret" || -z "$tenant_id" ]]; then
    return 1
  fi
  az login --service-principal \
    -u "$client_id" \
    -p "$client_secret" \
    --tenant "$tenant_id" \
    -o none
  if [[ -n "$subscription_id" ]]; then
    az account set --subscription "$subscription_id"
  fi
}

require_azure_session() {
  try_az_login_from_env || true
  if az account show -o none 2>/dev/null; then
    return 0
  fi
  echo "No active Azure CLI session in this environment." >&2
  echo "Options:" >&2
  echo "  1) az login --use-device-code   (interactive, in this agent terminal)" >&2
  echo "  2) Set env secrets on the Cloud Agent environment (not Git):" >&2
  echo "     AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID, AZURE_SUBSCRIPTION_ID" >&2
  exit 1
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

tf_dev_output_raw() {
  local name="$1"
  terraform -chdir="$TF_DEV" output -raw "$name" 2>/dev/null || return 1
}

# Sets RESOLVED_RG, RESOLVED_ACR_NAME, RESOLVED_ACR_LOGIN (env overrides: RESOURCE_GROUP, ACR_NAME, ACR_LOGIN_SERVER).
resolve_dev_acr() {
  RESOLVED_RG="${RESOURCE_GROUP:-}"
  RESOLVED_ACR_NAME="${ACR_NAME:-}"
  RESOLVED_ACR_LOGIN="${ACR_LOGIN_SERVER:-}"

  if [[ -z "$RESOLVED_RG" ]]; then
    RESOLVED_RG="$(tf_dev_output_raw resource_group_name || true)"
  fi
  RESOLVED_RG="${RESOLVED_RG:-dora-bp-dev-rg}"

  if [[ -z "$RESOLVED_ACR_LOGIN" ]]; then
    RESOLVED_ACR_LOGIN="$(tf_dev_output_raw container_registry_login_server || true)"
  fi

  if [[ -z "$RESOLVED_ACR_NAME && -n "$RESOLVED_ACR_LOGIN" ]]; then
    RESOLVED_ACR_NAME="${RESOLVED_ACR_LOGIN%%.azurecr.io}"
  fi

  if [[ -z "$RESOLVED_ACR_NAME" ]]; then
    RESOLVED_ACR_NAME="$(tf_dev_output_raw container_registry_name || true)"
  fi

  if [[ -z "$RESOLVED_ACR_NAME" || -z "$RESOLVED_ACR_LOGIN" ]]; then
    local line name login
    mapfile -t lines < <(az acr list -g "$RESOLVED_RG" --query "[].{name:name, login:loginServer}" -o tsv 2>/dev/null || true)
    if [[ "${#lines[@]}" -eq 0 ]]; then
      echo "No ACR in $RESOLVED_RG. Set ACR_NAME and ACR_LOGIN_SERVER." >&2
      return 1
    fi
    if [[ "${#lines[@]}" -gt 1 && -z "${ACR_NAME:-}" ]]; then
      echo "Multiple ACRs in $RESOLVED_RG; set ACR_NAME:" >&2
      az acr list -g "$RESOLVED_RG" --query "[].{name:name, loginServer:loginServer}" -o table >&2
      return 1
    fi
    line="${lines[0]}"
    name="$(awk '{print $1}' <<<"$line")"
    login="$(awk '{print $2}' <<<"$line")"
    RESOLVED_ACR_NAME="${RESOLVED_ACR_NAME:-$name}"
    RESOLVED_ACR_LOGIN="${RESOLVED_ACR_LOGIN:-$login}"
  fi

  if [[ -z "$RESOLVED_ACR_LOGIN" ]]; then
    RESOLVED_ACR_LOGIN="$(az acr show -g "$RESOLVED_RG" -n "$RESOLVED_ACR_NAME" --query loginServer -o tsv)"
  fi
}
