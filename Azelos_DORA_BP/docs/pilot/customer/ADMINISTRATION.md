# Administration (customer)

## Users and roles

Roles (simplified):

| Role | Typical access |
|------|----------------|
| **ORG_ADMIN** | Full tenant admin, invitations, configuration |
| **RISK_MANAGER** | Risk and provider registers |
| **SECURITY_MANAGER** | Security-oriented registers |
| **BUSINESS_CONTINUITY_MANAGER** | Incidents, resilience, BCP/DR |
| **AUDITOR** | Read-oriented oversight |
| **USER** | General read/write per module permissions |

Exact menu visibility follows role permissions in the application.

## Invitations

1. **ORG_ADMIN** opens **Team / Members**.
2. Create invitation with email and role.
3. Share the **accept-invite** link or token securely.
4. User sets password and lands in onboarding.

## Tenant configuration

- **Organization profile** — legal entity context for DORA-oriented views.
- **Applicability** — which requirements/modules apply.
- **Modules / custom fields** (if enabled in your deployment) — configuration layer for extended metadata.

Platform operators create the tenant; ORG_ADMIN owns ongoing configuration.

## Storage

Evidence files use configured object storage:

- **Local disk** (`STORAGE_PROVIDER=local`, path via `STORAGE_LOCAL_PATH`) — common in pilot Docker with a mounted volume.
- **Cloud** — Azure/S3/S3-compatible when implemented and configured for your environment.

Administrators should confirm **backup** includes both PostgreSQL and evidence storage.

## Authentication

- **Email + password** is the supported pilot mode.
- **OIDC** may be configured via environment variables for enterprise SSO — confirm with operator before promising SSO in pilot.

Password minimum length is enforced on invite acceptance (12 characters).

## Audit

- **Audit log** (administrators) shows many create/update actions for traceability.
- Not a substitute for enterprise SIEM or immutable audit archive unless you export and vault logs externally.

## Platform-only actions (not ORG_ADMIN)

- **Provision new organization** — SUPER_ADMIN only (`/admin/provision`).
- These are operator functions, not customer self-service on shared SaaS unless explicitly granted.
