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

ACR_ID="$(az acr show -g "$RG" -n "$ACR_NAME" --query id -o tsv)"

echo "Removing AcrPull role assignments (otherwise ACA may still use Entra MI for ACR)..."
while IFS= read -r pid; do
  [[ -z "$pid" ]] && continue
  while IFS= read -r rid; do
    [[ -z "$rid" ]] && continue
    echo "  Deleting role assignment $rid for principal $pid"
    az role assignment delete --ids "$rid" --output none 2>/dev/null || true
  done < <(az role assignment list --scope "$ACR_ID" --assignee "$pid" --query "[?roleDefinitionName=='AcrPull'].id" -o tsv 2>/dev/null || true)
done < <(az containerapp show -g "$RG" -n "$APP" --query "identity.userAssignedIdentities.*.principalId" -o tsv 2>/dev/null || true)

echo "Removing all existing registry entries (often still bound to managed identity)..."
while IFS= read -r server; do
  [[ -z "$server" ]] && continue
  echo "  remove $server"
  az containerapp registry remove -g "$RG" -n "$APP" --server "$server" --output none 2>/dev/null || true
done < <(az containerapp registry list -g "$RG" -n "$APP" --query "[].server" -o tsv 2>/dev/null || true)

echo "Adding registry with admin username/password (NOT --identity; NOT --password-secret)..."
# Wrong flags (--password-secret) make the CLI infer ACR via Entra → AADSTS500014.
az containerapp registry set -g "$RG" -n "$APP" \
  --server "$LOGIN" \
  --username "$ACR_USER" \
  --password "$ACR_PASS" \
  --output none

IMAGE="${CONTAINER_IMAGE:-}"
if [[ -z "$IMAGE" ]]; then
  IMAGE="$(az containerapp show -g "$RG" -n "$APP" --query "properties.template.containers[0].image" -o tsv 2>/dev/null || true)"
fi
if [[ -n "$IMAGE" ]]; then
  echo "Starting new revision with image: $IMAGE"
  az containerapp update -g "$RG" -n "$APP" --image "$IMAGE" --output none
fi

echo "Current registries (identity column should be empty):"
az containerapp registry list -g "$RG" -n "$APP" -o table

echo "Done. Check revision:"
echo "  az containerapp revision list -g $RG -n $APP -o table"
echo ""
echo "If revision STILL fails with AADSTS500014 / Identity proxy ACR token:"
echo "  Entra is blocking ALL *.azurecr.io pulls for apps with managed identity."
echo "  Use Docker Hub (public) instead:"
echo "    DOCKERHUB_USER=your-dockerhub-user ./scripts/azure/deploy-containerapp-dockerhub.sh"
