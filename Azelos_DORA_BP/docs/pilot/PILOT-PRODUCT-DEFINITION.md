# Pilot product definition

## What the customer is buying

An **operational DORA ICT resilience and third-party risk workspace**: a multi-tenant web application backed by PostgreSQL that lets a financial entity **register, link, and oversee** ICT third parties, contracts, services, critical functions, assets, risks, DORA-oriented requirements, evidence, incidents, and resilience testing—and **visualize dependencies**, **review KPIs**, and **produce oversight reports and exports** from that data.

This is **not** DORA compliance certification, legal advice, or an audit replacement.

## Who it is for

| Role | Typical use |
|------|-------------|
| **ICT / third-party risk** | Provider register, contracts, risk assessments, evidence |
| **Business continuity / resilience** | BCP/DR plans, resilience tests, incidents, DORA overview |
| **Compliance / DORA programme** | Requirement applicability and implementation status |
| **Management / oversight** | Dashboard, DORA hub, reports, exports |
| **Platform operator (Azelos)** | Tenant provisioning, environment health—not day-to-day entity data entry |

## Problem it solves

Financial entities must maintain **coherent, traceable registers** of ICT dependencies and resilience artefacts under DORA-style operational expectations. Spreadsheets and document shares fragment the chain from **provider → contract → service → function → risk → control/evidence**. The Blueprint centralizes that chain in one tenant-scoped system with a **relationship map**, **dashboards**, and **exportable registers**.

## What the customer must provide

- **PostgreSQL 16+** (hosted by customer or agreed host) and network access from the application
- **Object storage** for evidence files (local disk for pilot; cloud blob/S3 when adapters are configured)
- **Identity for users** (email/password today; OIDC env hooks exist but are not required for pilot)
- **Accurate business data** (providers, contracts, classifications, risk judgements, evidence files)
- **Internal roles** (who owns providers, BCM, compliance)
- **Operational decisions** (applicability of requirements, risk treatment, incident classification)

## What the Blueprint does automatically

- **Tenant isolation** (organization-scoped data and APIs)
- **Baseline DORA requirement catalogue** copied to each organization at provisioning (from migrated reference data)
- **Risk level calculation** from dimension inputs (versioned calculation)
- **Relationship graph** (GraphQL) from linked entities
- **Dashboard / DORA overview KPIs** from live database counts and statuses
- **Report and CSV/ZIP export generation** from tenant data
- **Audit records** for many create/update operations (platform audit log)
- **Schema migrations** via Alembic on deploy (entrypoint in Docker image)
- **Health (`/health`) and readiness (`/ready`)** including DB and migration alignment checks

## What remains the customer’s responsibility

- Regulatory interpretation and **legal assessment** of DORA obligations
- **Completeness and accuracy** of registers and evidence
- **Contractual negotiations** with ICT providers
- **Incident response** execution outside the tool
- **Backup, DR, and security** of infrastructure they host
- **User access governance** (offboarding, password policy, MFA at identity provider when OIDC is used)

## What requires configuration

| Item | Notes |
|------|--------|
| `DATABASE_URL` | Required |
| `JWT_SECRET_KEY` | Required in production (`APP_ENV=production`, ≥32 chars) |
| `CORS_ORIGINS` | Match customer UI origin(s) |
| `STORAGE_PROVIDER` / paths or cloud credentials | Evidence bytes |
| `SERVE_FRONTEND` | Single-container UI+API, or nginx frontend profile |
| Organization **profile** and **applicability** | Per tenant, in-app |
| Optional module/config toggles | Configuration layer where enabled |

## Optional integrations

- **OIDC / SSO** (configuration placeholders; email/password is the supported pilot path)
- **Azure Blob / S3 / S3-compatible** evidence storage (stubs/adapters—confirm before promising in contract)
- **Terraform Azure modules** in `infra/terraform` (optional hosting path, separate from app logic)
- **GraphQL** consumers (authenticated, same tenant rules as REST)

## Explicitly outside product scope

- DORA **certification** or regulator submission packaging
- **Legal** or **audit** opinions
- Automated **regulatory change** monitoring
- **GRC tool** parity (policy libraries, full audit management, vendor questionnaires at scale)
- **Marketplace / APIO** functionality (separate product)
- **AI** contract review in production (where not implemented, do not sell it)
- **Managed SOC** or incident handling as a service
