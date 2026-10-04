#!/usr/bin/env bash
# Force Container App to pull ACR with admin user (bypasses Entra AADSTS500014 / stale MI registry).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TF_DIR="$REPO_ROOT/infra/terraform/environments/dev"

cd "$TF_DIR"
RG="${RESOURCE_GROUP:-dora-bp-dev-rg}"
APP="${CONTAINER_APP_NAME:-dora-bp-dev-app}"
if terraform output -raw resource_group_name &>/dev/null; then
  RG="$(terraform output -raw resource_group_name)"
fi
if terraform output -raw application_url &>/dev/null; then
  APP="$(terraform output -raw application_url | sed -n 's|https://\([^.]*\)\..*|\1|p')"
fi
ACR_NAME="$(terraform output -raw container_registry_name)"
LOGIN="$(terraform output -raw container_registry_login_server)"

echo "Resource group: $RG  Container app: $APP  ACR: $ACR_NAME"

ACR_USER="$(az acr credential show --name "$ACR_NAME" --query username -o tsv)"
ACR_PASS="$(az acr credential show --name "$ACR_NAME" --query 'passwords[0].value' -o tsv)"
if [[ -z "$ACR_USER" || -z "$ACR_PASS" ]]; then
  echo "Enable ACR admin: az acr update --name $ACR_NAME --admin-enabled true" >&2
  exit 1
fi

echo "Setting acr-password secret and admin registry (no managed identity on registry)..."
az containerapp secret set -g "$RG" -n "$APP" --secrets "acr-password=$ACR_PASS" --output none

# Drop any existing registry entry for this server (often still bound to MI).
while IFS= read -r _; do
  az containerapp registry remove -g "$RG" -n "$APP" --server "$LOGIN" --output none 2>/dev/null || true
done < <(az containerapp registry list -g "$RG" -n "$APP" --query "[?server=='${LOGIN}']" -o tsv 2>/dev/null || true)

az containerapp registry set -g "$RG" -n "$APP" \
  --server "$LOGIN" \
  --username "$ACR_USER" \
  --password-secret acr-password \
  --output none

echo "Current registries:"
az containerapp registry list -g "$RG" -n "$APP" -o table

echo "Done. New revision should pull without Entra ACR token. Check: az containerapp revision list -g $RG -n $APP -o table"
