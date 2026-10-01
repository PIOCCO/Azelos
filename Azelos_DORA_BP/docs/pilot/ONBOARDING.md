# Pilot onboarding procedure

Two roles: **platform operator** (Azelos or customer IT hosting the instance) and **customer administrator** (ORG_ADMIN at the financial entity).

---

## Platform operator

| Step | Action | Azelos / operator required? |
|------|--------|----------------------------|
| 1 | Deploy PostgreSQL 16+ and run `alembic upgrade head` | **Yes** — infrastructure |
| 2 | Set `JWT_SECRET_KEY`, `DATABASE_URL`, `CORS_ORIGINS`, storage env | **Yes** |
| 3 | Create **SUPER_ADMIN**: `python scripts/bootstrap_platform_operator.py --email … --password …` | **Yes** — one-time per environment |
| 4 | Login as SUPER_ADMIN → **Admin → Provision customer organization** (or `POST /api/v1/tenant/provision`) | **Yes** for hosted multi-tenant; customer self-host may delegate |
| 5 | Hand ORG_ADMIN credentials **or** invitation link to customer | **Yes** — secure channel |
| 6 | Verify `/health` and `/ready` | **Yes** |
| 7 | Verify evidence storage: upload test file, download, restart app, download again | **Yes** — confirm volume/blob persistence |
| 8 | Verify authentication: login, 401 on protected API without token | **Yes** |
| 9 | *(Optional demo only)* `python scripts/seed_pilot_demo.py` on **non-production** demo DB | **Azelos** for sales demo; **not** on customer prod DB |

**Operator does not** enter customer provider/contract data unless agreed implementation assistance.

---

## Customer administrator

| # | Step | Operator assistance? |
|---|------|----------------------|
| 1 | Accept invitation (`/accept-invite?token=…`) **or** login with provisioned password | Only if invite/token delivery |
| 2 | Login | No |
| 3 | Open **Get started / Onboarding** wizard | No |
| 4 | Complete **organization profile** (type, size, regulatory status) | No |
| 5 | **Review DORA applicability** (read-only; complete profile in step 4 first) | No |
| 6 | **Invite** internal users (Team / Members) | No |
| 7 | Register **ICT providers** | No |
| 8 | Register **contracts** linked to providers | No |
| 9 | Register **ICT services** linked to contracts | No |
| 10 | Define **business functions** (critical/important) | No |
| 11 | Register **ICT / information assets** and link to functions where needed | No |
| 12 | Record **risk assessments** on provider/contract/service | No |
| 13 | Update **requirement** applicability and implementation status | No |
| 14 | **Upload evidence** and link to requirements where used | No |
| 15 | Register **incidents** and **resilience tests**; BCP/DR records as needed | No |
| 16 | Review **relationship map** (`/dora/relationship-map`) | No |
| 17 | Review **dashboard** and **DORA overview**; run **reports** and **exports** | No |

**Typical operator assistance:** steps 1–9 in platform section, SSO/DNS/TLS, backup runbook, and optional data migration workshops—not ongoing data entry.

---

## Suggested timeline (pilot)

| Week | Focus |
|------|--------|
| 0 | Deploy, operator bootstrap, tenant provision, ORG_ADMIN access |
| 1 | Profile, applicability, first 3–5 providers and contracts |
| 2 | Services, functions, dependencies, first risks and evidence |
| 3 | Incidents/resilience records, map review, first report/export |
| 4+ | Expand coverage; measure metrics in [SUCCESS-METRICS.md](./SUCCESS-METRICS.md) |
