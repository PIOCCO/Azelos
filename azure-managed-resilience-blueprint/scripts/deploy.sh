#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TF_DIR="${ROOT}/terraform/environments/dev"

echo "1. Verify Azure login"
az account show >/dev/null

echo "2. Verify subscription"
SUB_ID="$(az account show --query id -o tsv)"
echo "   Subscription: ${SUB_ID}"

echo "3–5. Deploy infrastructure (Terraform)"
cd "${TF_DIR}"
terraform init -input=false
terraform apply -auto-approve -var="subscription_id=${SUB_ID}" "$@"

ACR="$(terraform output -raw acr_login_server)"
DASH_URL="$(terraform output -raw dashboard_url)"
API_URL="$(terraform output -raw api_url)"

echo "6. Configure Managed Identity roles (see AZURE_PERMISSIONS.md)"
echo "   API principal: $(terraform output -raw api_managed_identity_principal_id)"

echo "7–8. Build and push containers"
ACR_NAME="${ACR%%.*}"
az acr login --name "${ACR_NAME}"
docker build -f "${ROOT}/docker/Dockerfile.api" -t "${ACR}/amrf-api:latest" "${ROOT}"
docker build -f "${ROOT}/frontend/Dockerfile" -t "${ACR}/amrf-dashboard:latest" "${ROOT}/frontend"
docker push "${ACR}/amrf-api:latest"
docker push "${ACR}/amrf-dashboard:latest"

echo "9. Update Container Apps"
terraform apply -auto-approve -var="subscription_id=${SUB_ID}" "$@"

echo "10–11. Migrations run on API startup; health check"
curl -fsS "${API_URL}/api/v1/health" || echo "Retry after cold start: ${API_URL}/api/v1/health"

echo ""
echo "Deployment complete."
echo ""
echo "Dashboard:"
echo "${DASH_URL}"
