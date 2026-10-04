#!/usr/bin/env bash
# Force Container App to pull ACR with admin user (bypasses Entra AADSTS500014 / stale MI registry).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

require_cmd terraform az
try_az_login_from_env || true
if ! az account show -o none 2>/dev/null; then
  echo "Run 'az login' first." >&2
  exit 1
fi

resolve_dev_acr

APP="${CONTAINER_APP_NAME:-}"
if [[ -z "$APP" ]]; then
  url="$(tf_dev_output_raw application_url || true)"
  if [[ -n "$url" ]]; then
    APP="$(sed -n 's|https://\([^.]*\)\..*|\1|p' <<<"$url")"
  fi
fi
APP="${APP:-dora-bp-dev-app}"

RG="$RESOLVED_RG"
ACR_NAME="$RESOLVED_ACR_NAME"
LOGIN="$RESOLVED_ACR_LOGIN"

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
