# Pilot feedback instrumentation

**Principle:** no invasive product analytics. Use **existing mechanisms** and **lightweight operator collection**.

## What to measure during the pilot

| Signal | Method |
|--------|--------|
| Onboarding completion | Checklist in [ONBOARDING.md](./ONBOARDING.md); ORG_ADMIN self-report |
| Active users | Weekly: list of users with login (support can ask; optional query on audit if login audited) |
| Modules used | Review **Audit log** (Admin) for entity types created/updated |
| Entities created | Counts from dashboard / DORA overview / exports at T0 and T1 |
| Reports generated | Customer log + report timestamps |
| Exports generated | Customer log |
| Evidence uploaded | Evidence list count + storage size |
| Relationship map usage | Interview: “How often did you open the map?” |
| Workflow abandonment | Interview + support tickets (where users stopped) |
| Support requests | Support channel ticket count and category |
| Manual work outside BP | Interview and questionnaire |

## Existing product signals (no new code)

- **Platform audit log** (`/admin/audit` UI, API `/api/v1/audit-records`) — creates/updates on many entities
- **Dashboard / DORA overview** — point-in-time KPIs for reviews
- **Tenant export** — snapshot for migration/backup discussions

## Optional operator queries (PostgreSQL, read-only)

Run only with customer approval; examples:

- Count rows per table filtered by `financial_entity_id`
- Evidence `size_bytes` sum per tenant

Do not export other tenants’ data in shared environments.

---

## Structured feedback questionnaire

Send at **mid-pilot** and **end of pilot**. Neutral wording; free text encouraged.

1. What problem were you trying to solve with this pilot?
2. What did you use before for this work (tools, spreadsheets, other GRC)?
3. Which workflow in the Blueprint was **most useful**? Why?
4. Which workflow was **confusing or slow**? What happened?
5. What still requires **Excel or manual** steps outside the system?
6. What **information or fields** were missing for your process?
7. What would **prevent production adoption** if unchanged?
8. How **often** would you expect to use the system (daily / weekly / monthly)?
9. **Who** would use it (roles, teams)?
10. What **other systems** would need to integrate (ITSM, CMDB, document management, IAM)?
11. What would make the system **operationally valuable** on a recurring basis (reports, meetings, audits)?

**Optional rating (1–5):** ease of onboarding, trust in data, usefulness of relationship map, usefulness of reports.

Store responses outside the application (survey doc, CRM, or ticket system).
