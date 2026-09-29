# FastAPI completion plan

## Current gaps

- Org profile/applicability/modules live in one router file with inline module SQL.
- Applicability response is minimal (`flags` only); needs structured modules/features/rules.
- Missing v1 routes: `ict-providers` alias, `contracts`, `ict-services`, `sub-outsourcing`, `information-assets`.
- No `RequirementService` / `ModuleService`; limited repositories for config domain.
- Org path access uses ad-hoc `assert_organization_access`.

## Actions (incremental)

1. Add `app/core/org_context.py` dependency + `app/rules/applicability_engine.py`.
2. Add repositories/services for modules, requirements, contracts, ICT services, subcontractors, information assets.
3. Split routers: `profiles`, `applicability`, `modules`, `requirements`, `providers`, `contracts`, `ict_services`, `sub_outsourcing`, `assets`.
4. Enrich applicability API response; keep logic in `ApplicabilityService` only.
5. Expand tests (tenant isolation, applicability API, E2E flow on PostgreSQL).
6. Deprecate duplicate `organization_profile.py` and `/suppliers` (keep alias).
