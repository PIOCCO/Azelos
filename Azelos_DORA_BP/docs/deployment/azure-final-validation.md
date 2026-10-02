# Azure final validation (living document)

**Status:** In progress — deployment not started on Azure from automation VM.

| Phase | Status | Date |
|-------|--------|------|
| 0 — Inspect | **Complete** | 2026-10-02 |
| 1 — Prepare Azure staging | **Blocked** | No Azure CLI/credentials in agent VM |
| 2 — Container/build validation | **Partial** | Local build/tests only |
| 3–16 | **Not started** | — |

See `azure-deployment-plan.md` for architecture and operator steps.

---

## Final gate (pending)

**NOT READY FOR CUSTOMER PILOT**

### P0 blockers

| ID | Blocker |
|----|---------|
| P0-AZ-1 | Staging Azure resources not provisioned (no subscription access from this environment) |
| P0-AZ-2 | End-to-end validation on staging HTTPS URL not performed |
| P0-DEP-1 | `Dockerfile.app` must include Azure storage SDK before blob evidence works on ACA |
| P0-DEP-2 | Terraform should set `APP_ENV=production` for staging/prod |

---

## Phase 0 evidence

- Plan written: `docs/deployment/azure-deployment-plan.md`
- Frontend build: pass (`npm run build`)
- Backend tests: **115 passed** (local PostgreSQL)
- Terraform staging: `terraform validate` succeeds (prior run)
- `az` CLI: **not installed**; no `ARM_*` / `AZURE_*` credentials in environment

---

*(Sections 1–20 will be filled as phases complete on a real staging deployment.)*
