# Deployment

## Prerequisites

- Azure subscription, Owner or custom RBAC for deployment
- Terraform >= 1.5, Azure CLI, Python 3.10+
- Remote state storage (see `terraform/environments/dev/backend.tf.example`)

## Azure setup

```bash
az login
az account set --subscription "<SUBSCRIPTION_ID>"
# Create state RG + storage (once per org)
```

## Configure client

1. Copy `.env.example` → `.env`
2. Edit `client.yaml` (regions, profile, RTO/RPO inputs, URLs)
3. Edit `business-continuity/critical-assets.yaml`

## Deploy

```bash
pip install -r requirements.txt
chmod +x scripts/*.sh
./scripts/deploy.sh dev
# Review plan
cd terraform/environments/dev && terraform apply tfplan
```

Production uses explicit promotion — do not auto-apply from PRs.

```bash
BCBP_ENV=production ./scripts/deploy.sh production
```

## Validate RTO/RPO (estimated capability)

```bash
python3 automation/bcdr/validate_rto_rpo.py
```

## Initial tests

```bash
BCBP_MOCK_MODE=true ./scripts/backup.sh
BCBP_MOCK_MODE=true ./scripts/recovery-test.sh
python3 automation/bcdr/scorecard.py
```
