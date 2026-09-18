# Azure Lighthouse

Target operating model:

```text
Customer Azure Tenant
        │
        ▼
Azure Lighthouse delegation (least-privilege custom role)
        │
        ▼
Your managed service subscription (this blueprint)
```

## Onboarding steps (conceptual)

1. Publish **Azure Managed Application** or Lighthouse **service provider offer** with the roles in `AZURE_PERMISSIONS.md`.
2. Customer deploys the template in their tenant (read-only + backup/ASR readers).
3. Platform stores `tenant_id` + `azure_subscription_id` in PostgreSQL.
4. Collectors use managed identity + delegated access (no long-lived secrets).

Do **not** request Owner on customer subscriptions unless a specific approved remediation runbook requires it.
