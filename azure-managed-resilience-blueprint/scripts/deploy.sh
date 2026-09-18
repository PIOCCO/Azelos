#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TF_DIR="${ROOT}/terraform/environments/dev"

fail() { echo "ERROR: $1" >&2; exit 1; }

echo "1. Verify Azure CLI"
command -v az >/dev/null || fail "Azure CLI (az) not installed"

echo "2. Verify authentication"
az account show >/dev/null || fail "Run 'az login' first"

echo "3. Verify subscription"
SUB_ID="$(az account show --query id -o tsv)"
[[ -n "${SUB_ID}" ]] || fail "Could not resolve subscription id"
echo "   Subscription: ${SUB_ID}"

echo "4. Verify Terraform"
command -v terraform >/dev/null || fail "Terraform not installed"

echo "5. Validate configuration"
[[ -f "${TF_DIR}/terraform.tfvars" ]] || echo "   Warning: terraform.tfvars missing — using CLI -var only"

echo "6. Terraform init/validate"
cd "${TF_DIR}"
terraform init -input=false
terraform validate || fail "Terraform validation failed"

echo "7. Deploy infrastructure"
terraform apply -auto-approve -var="subscription_id=${SUB_ID}" "$@"

ACR="$(terraform output -raw acr_login_server)"
DASH_URL="$(terraform output -raw dashboard_url)"
API_URL="$(terraform output -raw api_url)"
API_PRINCIPAL="$(terraform output -raw api_managed_identity_principal_id)"

echo "8. Build application images"
command -v docker >/dev/null || fail "Docker not installed"
ACR_NAME="${ACR%%.*}"
az acr login --name "${ACR_NAME}"
docker build -f "${ROOT}/docker/Dockerfile.api" -t "${ACR}/amrf-api:latest" "${ROOT}"
docker build -f "${ROOT}/frontend/Dockerfile" -t "${ACR}/amrf-dashboard:latest" "${ROOT}/frontend"

echo "9. Push to ACR"
docker push "${ACR}/amrf-api:latest"
docker push "${ACR}/amrf-dashboard:latest"

echo "10. Deploy Container Apps revision"
terraform apply -auto-approve -var="subscription_id=${SUB_ID}" "$@"

echo "11. Wait for readiness"
for i in 1 2 3 4 5 6; do
  if curl -fsS "${API_URL}/api/v1/ready" >/dev/null; then
    break
  fi
  sleep 10
done
curl -fsS "${API_URL}/api/v1/health" || fail "API health check failed: ${API_URL}/api/v1/health"

echo ""
echo "Deployment complete — Atlas Azure Resilience"
echo ""
echo "Dashboard: ${DASH_URL}"
echo "API:       ${API_URL}"
echo ""
echo "Next steps:"
echo "  • Assign Azure roles to managed identity ${API_PRINCIPAL} (see docs/AZURE_PERMISSIONS.md)"
echo "  • Set DEMO_MODE=false and AZURE_SUBSCRIPTION_ID on the API Container App for live discovery"
echo "  • Configure AUTH_MODE=entra before production traffic"
