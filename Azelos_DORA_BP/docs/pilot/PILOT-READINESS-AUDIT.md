# Pilot-readiness audit

**Date context:** First real customer pilot preparation.  
**Docker `compose --profile full`:** **NOT EXECUTED** (no Docker CLI/daemon in validation environment).  
**Demo API verification:** `scripts/verify_nordhaven_demo.py` — **all steps PASS** against running API + seeded Nordhaven tenant.

## Documentation inconsistencies (concrete)

| Issue | Where | Correction |
|-------|--------|------------|
| “Configure DORA applicability” sounds editable | ONBOARDING, customer guides | Applicability is **read-only** in UI; driven by **organization profile**. Customer **reviews** applicability after profile update. |
| “Configure organization” on operator path | User audit step 5 | Operator **provisions** tenant only; **ORG_ADMIN** completes profile. |
| Tenant ZIP export in demo walkthrough | DEMO-SCENARIO step 16 | **Providers CSV** has UI (Providers page). **Full tenant ZIP** is **API only** (`GET /api/v1/tenant/data/export` with auth)—document for operators, not as primary customer self-service. |
| Evidence ↔ requirement link | Operating docs | **API exists** (`linkEvidenceToRequirement`); **no UI** to link after upload. Pilot: update requirement **status** in UI; linking may exist from seed/API only until post-pilot feedback. |
| Root README still says “FastAPI … out of scope” | `README.md` line ~14 | Stale vs current product; use [INSTALL-AND-USE.md](./INSTALL-AND-USE.md) for pilots. |
| Reports output | Reports page | JSON in browser, not PDF—set customer expectations. |

No contradictions found in product boundary vs implemented modules for pilot scope.

---

## Platform operator workflow

| Step | Classification | Notes |
|------|----------------|-------|
| 1 Deploy | **WORKS** | Docker documented; not re-run here. Host path: venv + uvicorn or `start-web-one-port.sh`. |
| 2 Configure environment | **WORKS** | Env vars documented in customer/DEPLOYMENT.md |
| 3 Bootstrap operator | **WORKS** | `bootstrap_platform_operator.py` |
| 4 Provision tenant | **WORKS** | UI `/admin/provision` or `POST /api/v1/tenant/provision` |
| 5 Configure organization | **DOCUMENTATION GAP** | Operator does **not** configure customer profile—customer does post-login. |
| 6 Create/invite ORG_ADMIN | **WORKS** | Password at provision **or** `POST /api/v1/memberships/invitations` + accept |
| 7 Verify authentication | **WORKS** | Login + 401 without token |
| 8 Verify storage | **WORKS WITH OPERATOR ASSISTANCE** | Upload/download; Docker needs `dora_evidence_data` volume; manual restart check |
| 9 Verify health/readiness | **WORKS** | `/health`, `/ready` |

---

## Customer workflow

| Step | Classification | Notes |
|------|----------------|-------|
| 1 Accept invitation | **WORKS** | `/accept-invite`, API accept |
| 2 Login | **WORKS** | Multi-org selection when applicable |
| 3 Complete organization profile | **WORKS** | Onboarding / Profile |
| 4 Configure applicability | **DOCUMENTATION GAP** | **Review only**; complete profile first |
| 5 Invite users | **WORKS** | Team / Members (ORG_ADMIN) |
| 6 Create providers | **WORKS** | |
| 7 Create contracts | **WORKS** | |
| 8 Create ICT services | **WORKS** | |
| 9 Create business functions | **WORKS** | |
| 10 Create assets | **WORKS** | |
| 11 Register risks | **WORKS** | |
| 12 Configure requirements | **WORKS** | Status/applicable in UI |
| 13 Upload evidence | **WORKS** | |
| 13b Link evidence to requirement | **DOCUMENTATION GAP** | No UI; API only |
| 14 Incidents / resilience tests | **WORKS** | Incidents, resilience tests, BCP, DRP list pages |
| 15 Relationship map | **WORKS** | GraphQL + React Flow |
| 16 Dashboards | **WORKS** | Dashboard + DORA overview |
| 17 Generate reports | **WORKS** | JSON reports on Reports page |
| 18 Generate exports | **WORKS WITH OPERATOR ASSISTANCE** | CSV in UI; tenant ZIP via API |

---

## Technical blockers before first pilot

**None demonstrated** that prevent a pilot on a correctly configured host (Postgres + secrets + evidence persistence).

**Must complete operationally (not code):**

1. One successful **Docker compose smoke** in an environment with Docker.
2. Align customer expectations on **read-only applicability**, **JSON reports**, **export UI scope**, **evidence-requirement linking**.

---

## Items to wait until after customer feedback

- UI for evidence–requirement linking
- UI for tenant ZIP export
- PDF/formatted report output
- Persistent graph layouts
- OIDC/SSO as default login
- Cloud blob storage in production contracts
