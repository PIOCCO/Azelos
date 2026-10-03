# Azure deployment scripts

Operator scripts for **incremental** deployment of the DORA BP stack defined in `infra/terraform/`. They never print secrets and do not destroy existing resources.

## Prerequisites

- Azure CLI logged in (`az account show` succeeds)
- Terraform >= 1.5
- Docker (for image build/push after infra apply)
- `terraform.tfvars` in `infra/terraform/environments/dev/` (from `terraform.tfvars.example`)

**Cloud Agents:** Azure login on your laptop does not propagate to the agent VM. Run `az login --use-device-code` in the agent terminal once, or configure a service principal via environment secrets.

## Commands

```bash
cd Azelos_DORA_BP

# Verify subscription + list existing dora-bp resource groups
./scripts/azure/inspect-subscription.sh

# Plan dev deploy (stops before apply unless DEPLOY_AUTO_APPROVE=1)
./scripts/azure/deploy-dev.sh

# Apply bootstrap + dev after review
DEPLOY_AUTO_APPROVE=1 ./scripts/azure/deploy-dev.sh
```

See `infra/terraform/README.md` for architecture and post-apply migration steps.
