# Azelos DORA Blueprint — Production Readiness Audit

**Date:** 2026-10-01  
**Scope:** Full-stack BP as implemented on branch `cursor/v1-saas-p0-p1-f761`

## Product summary

| Dimension | Description |
|-----------|-------------|
| **Problem** | EU financial entities need a structured register of ICT third-party risk, DORA applicability, requirements, incidents, resilience artefacts, and relationship visibility. |
| **Target user** | Compliance / ICT risk / resilience teams at a **single financial entity** (tenant = organization). |
| **Main workflow** | Sign in → complete org profile & applicability → register providers/contracts/services/assets/functions → assess risks & controls → link evidence & requirements → explore relationship map → operational plans (BCP/DR/incidents) as needed. |
| **Data** | PostgreSQL multi-schema (`dora_core`, etc.): org profile, modules, requirements, ICT register, risks, evidence, incidents, BCP/DR/TLPT, cloud/resilience extensions, audit log. |
| **Integrations** | Local/Azure blob evidence storage; optional Entra OIDC; GraphQL for entity graph; Terraform/Azure for deployment (separate from app runtime). |

## Customer acceptance path (clean org)

1. **Provide:** Admin credentials, org legal identity, JWT/CORS/storage config in production.
2. **Configure:** Profile, applicability, enabled modules, regulatory requirement statuses.
3. **Register:** Providers, contracts, services, business functions, ICT assets, risk assessments.
4. **Operate:** Upload evidence (document types from DB), incidents, BCP/DR/tests where modules apply.
5. **Output:** Dashboard KPIs, DORA overview, relationship map, JSON resilience reports — **not** a regulatory certification.
6. **Manual:** Deep contract/legal review, Azure marketplace billing, full Entra SSO UX polish, hard tenant delete.
7. **Limitations:** List-only UI for several entities (contracts/services create via API/seed); invitation accept has no dedicated UI page (token API); graph layout session-only; S3/Azure adapters require env configuration.

## Fixes applied in this audit pass

- Dashboard incident KPI uses live `/incidents` API (removed stale 501 probe messaging).
- Evidence: `GET /evidence/document-types`, dropdown + download in UI.
- Operational modules: create forms for BCP, DR, resilience tests, TLPT.
- Removed incorrect `stub: true` flags for implemented modules in `nav.ts`.
- Tests: `test_production_readiness.py`.
