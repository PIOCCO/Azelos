# Azure permissions (least privilege)

Assign to the **API Container App managed identity** (output: `api_managed_identity_principal_id`):

| Role | Scope | Purpose |
|------|-------|---------|
| Reader | Subscription or MG | Resource Graph inventory |
| Monitoring Reader | Subscription | Metrics & Resource Health |
| Cost Management Reader | Subscription | FinOps data |
| Backup Reader | Subscription | Backup protection status |
| Site Recovery Reader | Subscription | ASR replication status |
| Security Reader | Subscription | Defender for Cloud findings |
| Log Analytics Reader | Log Analytics workspace | Query diagnostics (optional) |

**Not required for MVP demo**: Owner, Contributor on customer resources.

**Provider tenant**: deployer needs Contributor on the platform resource group and User Access Administrator to assign the above roles to the managed identity.

## Entra ID (production)

Register two app roles: Provider Admin, Customer Admin, Customer Viewer, Operator. Map to API RBAC — replace dev JWT login.
