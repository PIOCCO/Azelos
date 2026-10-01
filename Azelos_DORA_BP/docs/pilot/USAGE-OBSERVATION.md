# Usage observation plan (non-invasive)

No new analytics product. Record observations in a shared pilot log (spreadsheet or doc).

## Signals to record weekly

| Signal | How to collect |
|--------|----------------|
| Active users | Distinct emails that logged in (customer confirm or support tickets) |
| Modules accessed | **Audit log** (`/audit-log`) entity types; nav interview |
| Entities created | DORA overview deltas vs [BASELINE-MEASUREMENT.md](./BASELINE-MEASUREMENT.md) |
| Evidence uploaded | Evidence count / audit CREATE on Evidence |
| Reports generated | Customer self-report; optional audit if report endpoints audited |
| Exports generated | Customer self-report (CSV downloads) |
| Relationship map usage | Interview: “Opened map? Used in meeting?” |
| Workflow abandonment | Support tickets + interview (where users stopped) |
| Support requests | Ticket log by category |

## Existing product mechanisms

- **Audit log API/UI** — `/api/v1/audit-records`, Admin → Audit log
- **DORA overview** — snapshot KPIs for weekly standup
- **Tenant export** — optional end-of-pilot snapshot (operator-run API)

## What not to do

- No third-party session replay or screen recording without consent
- No cross-tenant reporting in shared SaaS without contract

## Pilot log template (one row per week)

| Week | Active users (count) | Notable audit activity | Reports/exports | Map used? | Support tickets | Notes |
