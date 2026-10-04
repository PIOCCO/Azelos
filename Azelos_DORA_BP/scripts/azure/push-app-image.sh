#!/usr/bin/env bash
# Build Dockerfile.app locally and push to dev ACR (no `az acr build` / ACR Tasks).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

require_cmd terraform docker az
try_az_login_from_env || true

IMAGE_NAME="${IMAGE_NAME:-dora-bp-app:latest}"

resolve_dev_acr
LOGIN_SERVER="$RESOLVED_ACR_LOGIN"
ACR_NAME="$RESOLVED_ACR_NAME"
FULL_IMAGE="${LOGIN_SERVER}/${IMAGE_NAME}"

echo "Building ${FULL_IMAGE} ..."
docker_build_push_for_container_apps "$ROOT/Dockerfile.app" "$ROOT" "$FULL_IMAGE"

echo "Logging in to ACR (admin credentials; requires admin enabled on registry) ..."
ACR_USER="$(az acr credential show --name "$ACR_NAME" --query username -o tsv)"
ACR_PASS="$(az acr credential show --name "$ACR_NAME" --query 'passwords[0].value' -o tsv)"
if [[ -z "$ACR_USER" || -z "$ACR_PASS" ]]; then
  echo "ACR admin credentials missing. Run: az acr update --name $ACR_NAME --admin-enabled true" >&2
  exit 1
fi
echo "$ACR_PASS" | docker login "$LOGIN_SERVER" -u "$ACR_USER" --password-stdin

echo "Pushing ..."
docker push "$FULL_IMAGE"
echo "Done. Set container_image = \"${FULL_IMAGE}\" in terraform.tfvars and terraform apply."
