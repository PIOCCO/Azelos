# Authentication

## Development (`ENVIRONMENT=development`, `AUTH_MODE=jwt`)

- Email/password against seeded users in PostgreSQL.
- JWT signed with `JWT_SECRET` (must not be default in production).
- **Not** a substitute for Microsoft Entra ID.

## Production (`ENVIRONMENT=production`, `AUTH_MODE=entra`)

- Password login is rejected at the API.
- Startup validation fails if `AUTH_MODE` is not `entra` or if `DEMO_MODE=true`.
- Implement Entra OIDC in `app/auth/base.py` (`EntraAuthProvider`) — placeholder today.

## Roles

| Role | Scope |
|------|--------|
| PROVIDER_ADMIN | All tenants (requires explicit `tenant_id`) |
| OPERATOR | Same as provider for operations |
| CUSTOMER_ADMIN | Single tenant; can sync and approve |
| CUSTOMER_VIEWER | Read-only |

Authorization is enforced in FastAPI dependencies — never rely on UI hiding alone.
