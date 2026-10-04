#!/usr/bin/env bash
# Build Dockerfile.app locally and push to dev ACR (no `az acr build` / ACR Tasks).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TF_DIR="$REPO_ROOT/infra/terraform/environments/dev"
IMAGE_NAME="${IMAGE_NAME:-dora-bp-app:latest}"

cd "$TF_DIR"
LOGIN_SERVER="$(terraform output -raw container_registry_login_server)"
ACR_NAME="$(terraform output -raw container_registry_name)"
FULL_IMAGE="${LOGIN_SERVER}/${IMAGE_NAME}"

echo "Building ${FULL_IMAGE} ..."
docker build -f "$REPO_ROOT/Dockerfile.app" -t "$FULL_IMAGE" "$REPO_ROOT"

echo "Logging in to ACR (admin credentials; requires acr_admin_enabled = true) ..."
ACR_USER="$(az acr credential show --name "$ACR_NAME" --query username -o tsv)"
ACR_PASS="$(az acr credential show --name "$ACR_NAME" --query 'passwords[0].value' -o tsv)"
if [[ -z "$ACR_USER" || -z "$ACR_PASS" ]]; then
  echo "ACR admin credentials missing. Run: az acr update --name $ACR_NAME --admin-enabled true" >&2
  echo "Or set acr_admin_enabled = true in terraform.tfvars and terraform apply." >&2
  exit 1
fi
echo "$ACR_PASS" | docker login "$LOGIN_SERVER" -u "$ACR_USER" --password-stdin

echo "Pushing ..."
docker push "$FULL_IMAGE"
echo "Done. Set container_image = \"${FULL_IMAGE}\" in terraform.tfvars and terraform apply."
