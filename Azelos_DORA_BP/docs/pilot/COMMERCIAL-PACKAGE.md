# Pilot commercial package (product-based)

This describes a **simple pilot offer** aligned with the **current** Blueprint. **Pricing is not stated as fact**—mark any numbers as internal hypotheses until validated with customers.

## Deployment model

| Option | Description |
|--------|-------------|
| **A — Customer-hosted** | Customer PostgreSQL + app container/VM; Azelos provides image/build and implementation guide |
| **B — Azelos-hosted pilot** | Single shared instance, dedicated tenant (same software, operator provisioning) |
| **C — Hybrid** | Customer DB, Azelos-managed app tier |

Pilot should name **one** model in the order form.

## Included assumptions

- **One financial entity (tenant)** per pilot agreement
- **Users:** typical pilot **5–15 named users** (ORG_ADMIN + risk + BCM + compliance + read-only); exact cap by contract
- **Modules:** all modules present in the deployed build (no separate licence keys in current product)
- **Duration:** **8–12 weeks** recommended (adjust in contract)
- **Support:** email/video within business hours; severity-based response targets **to be defined** in MSA
- **Implementation / onboarding:** operator deploy checklist + up to **N** onboarding workshops (internal hypothesis: 2–4 sessions)—validate with delivery capacity

## Customer infrastructure responsibility

- PostgreSQL availability, backups, encryption in transit/at rest
- Evidence storage (disk volume or cloud bucket)
- TLS termination, DNS, corporate network access
- User identity policy (password rotation; future SSO)

## Azelos / operator responsibility (when hosting)

- Application uptime for agreed window
- Migrations on upgrade
- Tenant provisioning and SUPER_ADMIN security
- Demo tenant optional on **separate** demo environment only

## Optional integrations (scoping only)

- OIDC SSO
- Azure Blob / S3 evidence (confirm adapter readiness before committing)
- GraphQL/REST read integrations to CMDB/ITSM — **customer or SI builds**

## After the pilot

| Outcome | Typical next step |
|---------|-------------------|
| **Continue** | Production deployment, backup SLA, SSO, expanded users, success metrics baseline |
| **Extend pilot** | Narrow scope or fix agreed gaps |
| **Stop** | Tenant export (ZIP), data deletion per contract |

## Internal pricing hypothesis (validate only)

Use customer conversations to test willingness to pay for: **per-tenant subscription**, **implementation fee**, **hosted premium**. Do not publish figures until validated.
