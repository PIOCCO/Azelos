# Security pre-production report

Generated as part of pre-Azure hardening on branch `cursor/security-hardening-e2e-f761`.

## Executive summary

No **critical** tenant-isolation or authentication bypass issues were found in automated tests. Several **medium** configuration and disclosure items were addressed (database status auth, security headers, GraphQL search bounds, control API schema fix). **BIA/BCP/DR/incident** workflows remain **partial** because corresponding domain models are incomplete.

## Security findings

| Severity | Component | Issue | Fix | Status |
|----------|-----------|-------|-----|--------|
| Medium | `/api/v1/database/status` | Unauthenticated schema/version disclosure | Requires `ORG_ADMIN` JWT | **Fixed** |
| Medium | HTTP responses | Missing baseline security headers | `SecurityHeadersMiddleware` | **Fixed** |
| Medium | GraphQL `graphSearch` | Unbounded/short query abuse | Min 2 / max 128 chars, limit ≤ 50 | **Fixed** |
| Medium | Controls API | Response schema mismatch (`title` vs `name`) | Aligned with `DoraControlDefinition` | **Fixed** |
| Low | JWT payload | `role` claim in token (ignored server-side) | Documented; membership is authoritative | **Mitigated** |
| Low | Config defaults | `JWT_SECRET_KEY=change-me`, `CORS_ORIGINS=*` | Documented in `.env.example`; Key Vault in Terraform | **Remaining** |
| Low | GraphQL | No query complexity plugin | Depth/node caps in service layer | **Partial** |
| Info | File upload | No multipart evidence upload on REST; metadata-only resilience evidence | Storage adapter tested locally | **Partial** |
| Info | Rate limiting | Not implemented | Azure Front Door / ACA ingress recommended | **Remaining** |

## Multi-tenancy

Tests performed (PostgreSQL, real APIs):

- REST cross-tenant provider/contract IDOR (`test_fastapi_tenant`, `test_integration_security`)
- GraphQL cross-tenant entity (`test_graphql_entity_graph`)
- JWT org context vs foreign object IDs

Result: **PASS** (deny/404, no cross-org data in graph responses).

## GraphQL

| Control | Result |
|---------|--------|
| Authentication required | **PASS** |
| Organization isolation | **PASS** |
| Depth limit (≤ 3) | **PASS** |
| Node cap (250) | **PASS** (service) |
| Search validation | **PASS** |
| Introspection in production | **PASS** (disabled when `APP_ENV=production`) |
| Query complexity limits | **PARTIAL** (no GraphQL-level complexity plugin) |

## DORA workflows

| Workflow | Result | Notes |
|----------|--------|-------|
| Org profile + applicability | **PASS** | E2E |
| Business function → ICT asset mapping | **PASS** | Criticality not overwritten |
| Information asset → ICT asset | **PASS** | E2E |
| Provider → contract → service → risk | **PASS** | E2E |
| Regulatory baseline read-only | **PASS** | GET only |
| Controls catalogue | **PASS** | After schema fix |
| Recovery test → finding → remediation → evidence | **PASS** | Resilience module |
| BIA / BCP / DR dedicated entities | **NOT TESTED** | Not in DB |
| Incident chain in graph | **NOT TESTED** | No incident model |
| Contract control assignment API | **PARTIAL** | List only |

## Test results (executed)

| Suite | Result |
|-------|--------|
| Backend `pytest -q` | **PASS** — 75 passed |
| Frontend vitest | **PASS** — 12 passed |
| Frontend production build | **PASS** |
| Terraform `validate` (dev) | **PASS** |
| Terraform `fmt -check` | **PASS** |
| Docker Compose stack | **NOT TESTED** — `docker` CLI unavailable on agent VM |
| Playwright E2E UI | **NOT TESTED** — not in repo |

## Production deployment blockers

1. Set strong `JWT_SECRET_KEY` and restrict `CORS_ORIGINS` (not `*`).
2. Set `APP_ENV=production` and `GRAPHQL_INTROSPECTION_ENABLED=false`.
3. Run full stack validation with Docker Compose on a host with Docker.
4. Complete BIA/BCP/DR/incident domain work before claiming full DORA resilience coverage.

## Authentication notes

- Passwords: `pbkdf2_sha256` via Passlib.
- Tokens: JWT HS256; expired/invalid tokens return 401.
- Role in JWT is **not** trusted for authorization; `OrganizationMembership.role` is used.
