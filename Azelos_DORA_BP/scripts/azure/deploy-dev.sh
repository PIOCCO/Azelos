#!/usr/bin/env bash
# Incremental dev deploy: bootstrap (if needed) → terraform init/plan/apply → build/push image hints.
# Does NOT delete resources. Set DEPLOY_AUTO_APPROVE=1 to run terraform apply without prompting.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "${SCRIPT_DIR}/common.sh"

require_cmd az terraform docker
require_azure_session
print_azure_context
ensure_providers
list_dora_resource_groups

echo ""
echo "=== Step 1: Remote state bootstrap (skip if ${PROJECT_NAME}-tfstate-rg exists) ==="
if bootstrap_state_exists; then
  echo "Reusing existing bootstrap resource group."
else
  echo "Bootstrap RG not found — planning bootstrap (review before apply)."
  terraform -chdir="$TF_BOOTSTRAP" init -input=false
  terraform -chdir="$TF_BOOTSTRAP" plan -input=false -out="${TF_BOOTSTRAP}/bootstrap.tfplan"
  if [[ "${DEPLOY_AUTO_APPROVE:-}" == "1" ]]; then
    terraform -chdir="$TF_BOOTSTRAP" apply -input=false "${TF_BOOTSTRAP}/bootstrap.tfplan"
  else
    echo "Apply bootstrap manually: terraform -chdir=${TF_BOOTSTRAP} apply bootstrap.tfplan"
    exit 0
  fi
fi

write_backend_hcl_from_bootstrap || true
ensure_tfvars

echo ""
echo "=== Step 2: Dev infrastructure (Terraform) ==="
terraform -chdir="$TF_DEV" init -input=false -backend-config=backend.hcl
terraform -chdir="$TF_DEV" fmt -check -recursive ../.. || terraform -chdir="$TF_DEV" fmt -recursive ../..
terraform -chdir="$TF_DEV" validate
terraform -chdir="$TF_DEV" plan -input=false -out="${TF_DEV}/dev.tfplan"

if [[ "${DEPLOY_AUTO_APPROVE:-}" != "1" ]]; then
  echo ""
  echo "Review dev.tfplan, then: DEPLOY_AUTO_APPROVE=1 $0"
  exit 0
fi

terraform -chdir="$TF_DEV" apply -input=false "${TF_DEV}/dev.tfplan"

echo ""
echo "=== Step 3: Post-apply (operator) ==="
ACR="$(terraform -chdir="$TF_DEV" output -raw container_registry_login_server)"
APP_URL="$(terraform -chdir="$TF_DEV" output -raw application_url)"
echo "ACR login server: ${ACR}"
echo "Application URL:  ${APP_URL}"
echo ""
echo "Build and push (from repo root):"
echo "  az acr login --name \$(echo ${ACR} | cut -d. -f1)"
echo "  docker build -f Dockerfile.app -t ${ACR}/dora-bp-app:\$(git rev-parse --short HEAD) ."
echo "  docker push ${ACR}/dora-bp-app:\$(git rev-parse --short HEAD)"
echo "Update container_image in terraform.tfvars to that tag, then terraform apply again if image changed."
echo ""
echo "PostgreSQL is private — run Alembic from VNet-connected runner (Container Apps Job / jump box)."
echo "Verify: curl -sf \"${APP_URL}/health\" && curl -sf \"${APP_URL}/ready\""
