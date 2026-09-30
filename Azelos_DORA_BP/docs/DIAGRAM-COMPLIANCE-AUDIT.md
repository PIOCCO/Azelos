# Diagram-to-code compliance audit

**Source of truth:** Azelos DORA Supplier Risk Blueprint architecture diagram (React → FastAPI → seven functional modules → SQLAlchemy/Alembic → PostgreSQL; Evidence → Storage abstraction → Local/Azure/S3/MinIO).

**Audit date:** 2026-09-30  
**Branch audited:** `cursor/dora-operational-e2e-f761`

## Diagram element mapping

| Diagram component | Platform surface | DB / models | Service / API | Frontend | Tests |
|-------------------|------------------|-------------|---------------|----------|-------|
| **Client users** | JWT login | `users`, `organization_memberships` | `POST /api/v1/auth/login` | `LoginPage`, `AuthContext` | `test_api_v1`, `test_fastapi_tenant` |
| **Web Application (React)** | SPA | — | GraphQL + REST | `App.tsx`, modules | vitest nav/graphql |
| **Authentication & Authorization** | Bearer + org in JWT | memberships | `get_auth_context`, `require_role` | `ProtectedRoute`, `ModuleGate`, `permissions.ts` | `test_integration_security`, `test_security_hardening` |
| **Supplier & Contract Management** | ICT providers, contracts, services, sub-outsourcing | `ict_providers`, `contracts`, `ict_services`, `subcontractors` | `/ict-providers`, `/contracts`, … | `ProvidersPage`, `ProviderDetailPage`, lists | `test_e2e_org_flow`, `test_diagram_workflows` |
| **Risk Assessment Engine** | ICT risk register | `risk_assessments` | `RiskService` v2 calc, `/risks` | `RisksPage`, `RiskDetailPage` | `test_api_v1`, diagram B |
| **DORA Compliance Engine** | Requirements, controls, service DORA links | `dora_*`, `organization_requirements`, `business_service_dora_links` | `/requirements`, `/controls`, `/resilience/dora-links` | `RequirementsPage`, `ControlsPage`, resilience hub | `test_profiles_applicability` |
| **Audit & Activity Logging** | Platform audit | `audit_records` | `record_platform_audit`, `/audit-records` | `AuditLogPage` | diagram B (supplier create) |
| **Reporting & Regulatory Export** | JSON reports | aggregates from resilience tables | `GET /resilience/reports/{type}` | `ReportsPage` | partial (API in `resilience_ops`) |
| **Evidence Management** | Evidence list/upload/download | `evidence`, `evidence_control_links` | `/evidence`, upload/download | `Evidence` list page | `test_storage`, `test_evidence_api` |
| **SQLAlchemy ORM** | All modules | Alembic migrations 001–009 | repositories + services | — | `test_database_integrity` |
| **Alembic migrations** | Schema evolution | `alembic/versions/*` | — | — | pytest session upgrade |
| **PostgreSQL (client-hosted)** | `DATABASE_URL` | single DB, `financial_entity_id` scoping | tenant checks in repos | — | `test_cross_entity_isolation` |
| **EvidenceStorage abstraction** | `STORAGE_PROVIDER` | metadata in `evidence` | `get_evidence_storage()` | — | `test_storage` |
| **Storage adapters** | Local implemented | — | `local.py` | — | `test_storage` |
| **Azure / S3 / MinIO** | Factory only | — | `NotImplementedError` unless configured | — | factory config tests |

**Extended platform (beyond original supplier-risk diagram box but in product nav):** cloud resilience (`business_services`, `recovery_tests`, findings/remediation), operational entities (`ict_incidents`, `resilience_tests`, BCP/DR, TLPT), GraphQL relationship map (`EntityGraphRepository`).

## Data flow verification (diagram pattern)

| Flow | Verified | Notes |
|------|----------|-------|
| User → React → FastAPI → service → PostgreSQL | **Yes** | No mock API in production paths |
| Risk create → DB → overview KPI | **Yes** | `/dora/overview` SQL aggregates |
| Supplier create → audit record | **Yes** (fixed in audit) | Also contracts |
| Evidence upload → storage → metadata row | **Yes** | Local adapter; cloud adapters optional |
| Graph node → DB entity | **Yes** | `EntityGraphRepository` reads ORM |
| Incident link → related entities | **Yes** | Validated tenant FKs in service |

## Relationship matrix (diagram vs database)

| Relationship | DB representation | Graph | UI trace |
|--------------|-------------------|-------|----------|
| BF ↔ ICT asset | `asset_function_maps` | SUPPORTS | Partial (no BF detail page) |
| BF ↔ ICT service | `function_service_mappings` | REALIZED_BY | **No public API** to create mapping |
| Service ↔ contract | `ict_services.contract_id` | UNDER_CONTRACT | List pages |
| Contract ↔ supplier | `contracts.provider_id` | PROVIDED_BY | Provider detail + graph |
| Risk ↔ supplier/contract/service | `risk_assessments.*_id` | ASSESSES | Risk detail |
| Incident ↔ entities | `ict_incident_links` (polymorphic) | AFFECTS | Incident detail |
| Finding ↔ service | `resilience_findings.business_service_id` | FINDING_ON | Findings list |
| Remediation ↔ finding | FK on `remediation_actions` | REMEDIATES | Remediation list |
| Evidence ↔ control | `evidence_control_links` | EVIDENCED_BY | Controls/evidence lists |
| **Application** (diagram-adjacent) | **Missing table** | — | Use ICT service/asset as stand-in |

## IMPLEMENTED (end-to-end per diagram core)

- React SPA with authenticated REST + GraphQL
- FastAPI modular routers → services → SQLAlchemy → PostgreSQL
- Supplier & contract CRUD with tenant isolation and RBAC
- Risk assessment engine (server-side scoring, not UI-calculated)
- DORA compliance baseline (requirements, contract controls, business service DORA links)
- Audit trail for incidents, risks (create), suppliers/contracts (create/update), resilience ops, evidence upload
- Reporting endpoint (JSON export, audited)
- Evidence metadata + local upload/download with auth
- Relationship map from real FK/domain graph (see `test_e2e_graph_relationship`, `test_diagram_workflows`)

## PARTIALLY IMPLEMENTED

- **Audit & Activity Logging:** Not every legacy CRUD path (e.g. all ICT asset mutations) writes `audit_records`; configuration uses separate `configuration_audit_log`
- **DORA Compliance Engine:** No automated “certification”; factual control states and requirements only
- **Reporting:** JSON summaries, not PDF/regulatory file packs
- **Risk lifecycle:** Assessment + PATCH metadata; no separate approval workflow entity
- **Incident lifecycle:** Status machine + timeline; no notification channel
- **Resilience testing (diagram):** `resilience_tests` campaigns + `recovery_tests`; not unified single table
- **Function ↔ service linking:** DB + graph support; **no REST API** for `FunctionServiceMapping` (gap vs full self-service UI)

## MISSING (relative to diagram or extended DORA ops)

- Dedicated **Application** entity layer
- **Approve** step as first-class workflow (risk/incident)
- **Azure/S3/MinIO** evidence adapters in production config (code stubs exist)
- **GraphQL mutations** (writes via REST only)
- Central **notification** delivery for deadlines
- **Rate limiting** / WAF (not in diagram but production gap)

## INCORRECT / NOT CONNECTED (before this audit; fixes applied)

- ~~501 stubs~~ replaced for incidents, BCP, DR, resilience-tests, TLPT lists
- ~~Incident links without tenant validation~~ → `validate_incident_link`
- ~~Supplier/contract mutations without platform audit~~ → audit on create/update

## UI ONLY (minimal)

- Some resilience/BCP/TLPT **create** flows (lists work; forms not full wizards)
- Module applicability hints (display; rules run on backend)

## BACKEND ONLY

- `FunctionServiceMapping` creation (seed/tests/DB only)
- Azure blob / S3 upload until `STORAGE_PROVIDER` configured

## DATA MODEL GAPS

- No `applications` table
- Incident links polymorphic (UUID) without DB-level FK per target type (validated in service)
- Risk ↔ finding not directly FK-linked (linked via business service context)

## API GAPS

- No REST for BF↔service mapping
- GraphQL read-only (no mutations)
- No dedicated “approve risk” endpoint

## SECURITY GAPS (remaining)

- GraphQL depth/limits enforced; continue monitoring query cost
- Evidence cloud adapters must be configured with least privilege in deployment
- Rate limiting not implemented in app layer

## TEST COVERAGE (diagram workflows)

| Scenario | Test file |
|----------|-----------|
| A — ICT risk chain | Partial: `test_operational_workflow`, `test_e2e_org_flow` |
| B — Supplier chain + audit + overview | `test_diagram_workflows::test_scenario_b_*` |
| C — Incident + tenant link rejection | `test_incidents`, `test_diagram_workflows::test_incident_rejects_cross_tenant_link` |
| D — Resilience test persisted | `test_diagram_workflows::test_scenario_d_*` |
| E — Graph from real FKs | `test_e2e_graph_relationship`, `test_diagram_workflows::test_scenario_e_*` |
| GraphQL auth/tenant | `test_graphql_entity_graph`, `test_e2e_graph_relationship` |
| RBAC / tenant | `test_fastapi_tenant`, `test_integration_security` |

**Full suite:** 84 backend tests (after diagram tests), 24 frontend vitest, production build OK.

## FINAL VERDICT

The platform **partially implements** the Supplier Risk Blueprint diagram **with functional equivalence on the core path** (auth → suppliers/contracts → risk engine → compliance artefacts → evidence abstraction → PostgreSQL → audit on key mutations → reporting API).

It **does not fully implement** a single unified diagram for all extended DORA operational modules (applications layer, approval gates, full audit on every mutation, external storage in default deploy).

**Do not claim full diagram compliance** until: application entity or explicit mapping decision, BF↔service API, complete audit coverage, and configured evidence storage backends are addressed.
