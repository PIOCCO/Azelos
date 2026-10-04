#!/usr/bin/env bash
# Force Container App to pull ACR with admin user (bypasses Entra AADSTS500014 / stale MI registry).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

REPO_ROOT="$ROOT"
TF_DIR="$REPO_ROOT/infra/terraform/environments/dev"

require_cmd terraform az

try_az_login_from_env || true
if ! az account show -o none 2>/dev/null; then
  echo "Run 'az login' first." >&2
  exit 1
fi

tf_output_raw() {
  local name="$1"
  if [[ ! -d "$TF_DIR/.terraform" ]] && [[ ! -f "$TF_DIR/terraform.tfstate" ]]; then
    return 1
  fi
  (cd "$TF_DIR" && terraform output -raw "$name" 2>/dev/null) || return 1
}

RG="${RESOURCE_GROUP:-}"
APP="${CONTAINER_APP_NAME:-}"
LOGIN="${ACR_LOGIN_SERVER:-}"
ACR_NAME="${ACR_NAME:-}"

if [[ -z "$RG" ]]; then
  RG="$(tf_output_raw resource_group_name || true)"
fi
RG="${RG:-dora-bp-dev-rg}"

if [[ -z "$APP" ]]; then
  url="$(tf_output_raw application_url || true)"
  if [[ -n "$url" ]]; then
    APP="$(sed -n 's|https://\([^.]*\)\..*|\1|p' <<<"$url")"
  fi
fi
APP="${APP:-dora-bp-dev-app}"

if [[ -z "$LOGIN" ]]; then
  LOGIN="$(tf_output_raw container_registry_login_server || true)"
fi

if [[ -z "$ACR_NAME" && -n "$LOGIN" ]]; then
  ACR_NAME="${LOGIN%%.azurecr.io}"
fi

if [[ -z "$ACR_NAME" ]]; then
  ACR_NAME="$(tf_output_raw container_registry_name || true)"
fi

if [[ -z "$ACR_NAME" || -z "$LOGIN" ]]; then
  echo "Discovering ACR in resource group $RG ..."
  mapfile -t acrs < <(az acr list -g "$RG" --query "[].{name:name, login:loginServer}" -o tsv 2>/dev/null || true)
  if [[ "${#acrs[@]}" -eq 0 ]]; then
    echo "No ACR in $RG. Set ACR_NAME and ACR_LOGIN_SERVER (or run terraform apply for outputs)." >&2
    exit 1
  fi
  if [[ "${#acrs[@]}" -gt 1 && -z "${ACR_NAME:-}" ]]; then
    echo "Multiple registries in $RG; set ACR_NAME explicitly:" >&2
    az acr list -g "$RG" --query "[].{name:name, loginServer:loginServer}" -o table >&2
    exit 1
  fi
  ACR_NAME="$(echo "${acrs[0]}" | awk '{print $1}')"
  LOGIN="$(echo "${acrs[0]}" | awk '{print $2}')"
fi

if [[ -z "$LOGIN" ]]; then
  LOGIN="$(az acr show -g "$RG" -n "$ACR_NAME" --query loginServer -o tsv)"
fi

echo "Resource group: $RG  Container app: $APP  ACR: $ACR_NAME  Login: $LOGIN"

ACR_USER="$(az acr credential show --name "$ACR_NAME" --query username -o tsv)"
ACR_PASS="$(az acr credential show --name "$ACR_NAME" --query 'passwords[0].value' -o tsv)"
if [[ -z "$ACR_USER" || -z "$ACR_PASS" ]]; then
  echo "Enable ACR admin: az acr update --name $ACR_NAME --admin-enabled true" >&2
  exit 1
fi

echo "Setting acr-password secret and admin registry (no managed identity on registry)..."
az containerapp secret set -g "$RG" -n "$APP" --secrets "acr-password=$ACR_PASS" --output none

az containerapp registry remove -g "$RG" -n "$APP" --server "$LOGIN" --output none 2>/dev/null || true

az containerapp registry set -g "$RG" -n "$APP" \
  --server "$LOGIN" \
  --username "$ACR_USER" \
  --password-secret acr-password \
  --output none

echo "Current registries:"
az containerapp registry list -g "$RG" -n "$APP" -o table

echo "Done. New revision should pull without Entra ACR token."
echo "Check: az containerapp revision list -g $RG -n $APP -o table"
