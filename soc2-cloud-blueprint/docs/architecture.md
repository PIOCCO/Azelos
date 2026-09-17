# Architecture

```text
config (client, controls, criteria)
        ↓
assessment (gap analysis, questionnaires)
        ↓
automation (checks, evidence collectors, readiness report)
        ↓
evidence/manifests/<client-timestamp>/
        ↓
auditor-ready package (human review required)
```

## Integrations (optional)

| Source | Config key | Purpose |
|--------|------------|---------|
| Web Hosting BP | `integrations.web_hosting.inventory_path` | Service inventory evidence |
| BCDR BP | `integrations.business_continuity.inventory_path` | Availability / recovery evidence |

No runtime coupling — file-based exports only.

## Cloud

Primary implementation helpers under `cloud/azure/`. AWS/GCP documented for future collectors.

Optional Terraform: `infrastructure/terraform/` — Log Analytics + Key Vault baseline.
