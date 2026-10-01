# Measurable pilot outcomes

Establish a **baseline in week 1** (after profile + applicability), then remeasure at **pilot end**. Do not assume improvement percentages without measured before/after.

## Coverage metrics (product can compute or export)

| Metric | Definition | How to measure |
|--------|------------|----------------|
| ICT providers registered | Count of active providers | Dashboard / export / SQL on `ict_providers` |
| Providers with ≥1 contract | Providers linked to a contract | Report or export join |
| Contracts with ≥1 ICT service | Contracts with services | Export |
| ICT services linked to a business function | Via dependency mappings | Dependencies page / graph |
| Critical functions with ≥1 linked service | CIF functions with mappings | Business functions + dependencies |
| Requirements with non–`not_started` status | Implementation tracked | Requirements list / export |
| Requirements with evidence link | Linked evidence rows | Requirements + evidence |
| Evidence items uploaded | Count + volume | Evidence list / storage |
| Open high/critical risks | `resulting_risk_level` filter | Risks page |
| Incidents recorded (period) | Count in pilot window | Incidents list |
| Resilience tests recorded | Campaign count | Resilience tests |
| Unlinked critical services | Critical services without function map | Manual review + graph |

## Operational efficiency (customer observes)

| Metric | Definition |
|--------|------------|
| Time to produce oversight report | Minutes from login to PDF/HTML report generated |
| Time to trace dependencies for one critical service | Minutes from service → map → function → provider |
| Time to onboard a new ICT provider (end-to-end) | Provider + contract + service + risk + one evidence |

Record these with a **stopwatch in week 1 and week N**; the product does not auto-track duration.

## Adoption metrics

| Metric | Source |
|--------|--------|
| Onboarding wizard completed | Org profile + applicability filled (manual check) |
| Active users (weekly) | Distinct login emails (see [FEEDBACK.md](./FEEDBACK.md)) |
| Modules touched | Audit log entity types / manual survey |
| Reports generated | Audit or customer report |
| Exports downloaded | Customer confirmation + audit where logged |
| Relationship map sessions | Customer interview (no invasive analytics) |

## Pilot success (example decision criteria)

Pilot is **successful for continuation** if, by agreement with the customer:

- ≥ agreed **provider/contract coverage** target for in-scope providers
- ≥ agreed **critical function linkage** target
- ORG_ADMIN can **produce one oversight report** without developer help
- **Tenant isolation** accepted after security review
- **No P0 defects** open blocking daily use

Targets are **negotiated per pilot**, not preset by the product.
