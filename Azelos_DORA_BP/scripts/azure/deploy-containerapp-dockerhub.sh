#!/usr/bin/env bash
# Deploy dev Container App from Docker Hub (bypasses Entra/ACR identity proxy on *.azurecr.io).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

require_cmd docker az
try_az_login_from_env || true
if ! az account show -o none 2>/dev/null; then
  echo "Run 'az login' first." >&2
  exit 1
fi

DOCKERHUB_USER="${DOCKERHUB_USER:-}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
IMAGE_NAME="${IMAGE_NAME:-dora-bp-app}"
if [[ -z "$DOCKERHUB_USER" ]]; then
  echo "Set DOCKERHUB_USER (Docker Hub namespace), e.g.:" >&2
  echo "  DOCKERHUB_USER=myuser ./scripts/azure/deploy-containerapp-dockerhub.sh" >&2
  exit 1
fi

PUBLIC_IMAGE="docker.io/${DOCKERHUB_USER}/${IMAGE_NAME}:${IMAGE_TAG}"

RG="${RESOURCE_GROUP:-dora-bp-dev-rg}"
APP="${CONTAINER_APP_NAME:-dora-bp-dev-app}"
if tf_dev_output_raw resource_group_name &>/dev/null; then
  RG="$(tf_dev_output_raw resource_group_name)"
fi
url="$(tf_dev_output_raw application_url 2>/dev/null || true)"
if [[ -n "$url" ]]; then
  APP="$(sed -n 's|https://\([^.]*\)\..*|\1|p' <<<"$url")"
fi

echo "Building and pushing ${PUBLIC_IMAGE} (public pull — no ACR/Entra) ..."
docker build -f "$ROOT/Dockerfile.app" -t "$PUBLIC_IMAGE" "$ROOT"
docker push "$PUBLIC_IMAGE"

echo "Removing ACR registry bindings from ${APP} (they trigger Entra identity proxy) ..."
while IFS= read -r server; do
  [[ -z "$server" ]] && continue
  az containerapp registry remove -g "$RG" -n "$APP" --server "$server" --output none 2>/dev/null || true
done < <(az containerapp registry list -g "$RG" -n "$APP" --query "[].server" -o tsv 2>/dev/null || true)

echo "Updating Container App image + dev storage (local disk, no blob MI) ..."
az containerapp update -g "$RG" -n "$APP" \
  --image "$PUBLIC_IMAGE" \
  --set-env-vars "STORAGE_PROVIDER=local" "STORAGE_LOCAL_PATH=/tmp/evidence" \
  --output none

echo "Done. URL:"
az containerapp show -g "$RG" -n "$APP" --query properties.configuration.ingress.fqdn -o tsv | sed 's/^/https:\/\//'
echo ""
echo "In terraform.tfvars use (no .azurecr.io → no ACR auth):"
echo "  container_image = \"${PUBLIC_IMAGE}\""
echo "  acr_admin_enabled = false"
