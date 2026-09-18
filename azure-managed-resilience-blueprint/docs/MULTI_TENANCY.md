# Multi-tenancy

- Every tenant-owned row includes `tenant_id`.
- Customer JWTs carry `tenant_id`; API rejects mismatched `tenant_id` query parameters.
- Provider users must pass `tenant_id` explicitly — no implicit cross-tenant default except development bootstrap tenant for demos.
- IDOR checks: approve/execute/acknowledge loads entity then calls `resolve_tenant_id(user, entity.tenant_id)`.

Automated tests cover resource reads and recommendation execution across tenants.
