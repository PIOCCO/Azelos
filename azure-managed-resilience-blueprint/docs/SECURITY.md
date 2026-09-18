# Security

- **Secrets**: JWT signing key in Key Vault (production); Managed Identity for Azure APIs.
- **Transport**: HTTPS via Azure Container Apps default hostname (custom domain optional).
- **Tenant isolation**: enforced in API (`resolve_tenant_id`); covered by tests.
- **Audit**: login, sync, recommendations, executed actions, reports — see `/api/v1/audit-logs`.
- **No auto-remediation** of production resources without explicit approval.
- **Security findings**: prefer Microsoft Defender for Cloud; supplemental Resource Graph checks in live collectors (roadmap).

Report vulnerabilities to your service operator — this blueprint is a deployable template, not a hosted SaaS.
