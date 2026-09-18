# Control Mapping (example)

| Control | Blueprint artifact | Evidence |
|---------|-------------------|----------|
| Backup retention | `client.yaml` backup.retention_days | Backup reports, RSV policy |
| Restore testing | `scripts/recovery-test.sh` | `recovery-test-report.json` |
| DR procedures | `recovery/runbooks/` | Drill reports |
| RTO/RPO governance | `business-continuity/rto-rpo.yaml` | `validate_rto_rpo.py` output |
| Immutable backups | Terraform storage + RSV soft delete | Azure policy screenshots |
| Least privilege | RBAC + managed identities | Terraform IAM modules |
| Audit logging | Log Analytics / Activity Log | `compliance/evidence/` |

Map client frameworks (SOC 2, ISO 27001) during engagement — this file is a starter template.
