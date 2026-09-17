# Runbook: Accidental Deletion

| Runbook ID | RB-DEL-001 |

## Detection

- Activity log delete events
- Missing resource alerts
- User report

## Containment

- Assign resource locks on production RGs (Terraform `azurerm_management_lock`)
- Disable deleting principal if insider risk

## Decision

| Deleted item | Recovery path |
|--------------|---------------|
| Soft-delete Key Vault / storage blob | Native undelete |
| PostgreSQL with backup | PITR |
| Resource group | Redeploy via Terraform + restore data |
| Terraform state | Backend versioning restore |

## Recovery

```bash
./scripts/restore.sh latest
./scripts/deploy.sh production
```

## Validation

- Asset inventory vs `critical-assets.yaml`

## Evidence

- Azure Activity Log export, restore report
