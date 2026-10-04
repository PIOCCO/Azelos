# Azure deployment scripts

Operator scripts for **incremental** deployment of the DORA BP stack defined in `infra/terraform/`. They never print secrets and do not destroy existing resources.

## Prerequisites

- Azure CLI logged in (`az account show` succeeds)
- Terraform >= 1.5
- Docker (for image build/push after infra apply)
- `terraform.tfvars` in `infra/terraform/environments/dev/` (from `terraform.tfvars.example`)

**Cloud Agents:** See [docs/azure/CLOUD-AGENT-AUTH.md](../docs/azure/CLOUD-AGENT-AUTH.md). Laptop `az login` does not propagate; use device code in the agent or `AZURE_*` environment secrets.

## Commands

```bash
cd Azelos_DORA_BP

# Verify subscription + list existing dora-bp resource groups
./scripts/azure/inspect-subscription.sh

# Plan dev deploy (stops before apply unless DEPLOY_AUTO_APPROVE=1)
./scripts/azure/deploy-dev.sh

# Apply bootstrap + dev after review
DEPLOY_AUTO_APPROVE=1 ./scripts/azure/deploy-dev.sh

# Build on your machine and push to ACR (when `az acr build` fails with TasksOperationsNotAllowed)
./scripts/azure/push-app-image.sh

# Container App still uses Entra MI for ACR (AADSTS500014) after apply
./scripts/azure/fix-containerapp-acr-admin.sh

# AADSTS500014 still after fix — deploy from Docker Hub (bypasses azurecr.io)
DOCKERHUB_USER=youruser ./scripts/azure/deploy-containerapp-dockerhub.sh
```

See `infra/terraform/README.md` for architecture and post-apply migration steps.

If ACR Tasks or Entra block cloud builds, see `infra/terraform/TROUBLESHOOTING-ACR-ENTRA.md`.
