# Cloud Business Resilience Platform

Azelos evolves the DORA Business Resilience Blueprint into a **Cloud Business Resilience Platform**. DORA remains a **required, first-class framework** with traceable requirements, controls, evidence, and findings — the product does **not** claim automatic regulatory compliance.

## Product workflow

```
Cloud Environment → Resource Discovery → Business Services → Dependencies
→ Resilience Assessment → DORA Control Mapping → Findings → Remediation
→ Evidence → Recovery Tests → Reports
```

## Domain mapping (existing vs new)

| Concept | Implementation |
|--------|----------------|
| Organization | `financial_entities` |
| User / Role | `users`, `organization_memberships` |
| DORA requirements | `dora_requirements`, `organization_requirements` |
| DORA controls (contractual catalogue) | `dora_control_definitions` |
| Legacy DORA business functions | `business_functions` (unchanged) |
| **Business services** (cloud resilience) | `business_services` (new) |
| **Cloud account / resources** | `cloud_accounts`, `cloud_resources` (new) |
| **Findings / remediation / tests** | `resilience_findings`, `remediation_actions`, `recovery_tests` (new) |
| **Platform evidence** | `resilience_evidence_items` (new; links uploads + discovered config) |
| Audit | `audit_records` (extended actions) |

Business services are **operational resilience units** (e.g. Customer Payments). DORA **business functions** remain for regulatory register / ICT mapping.

## Evidence categories

Every evidence or assessment output is tagged with a **source kind**:

- `discovered` — from cloud API inventory/configuration
- `user_provided` — entered by users
- `manually_verified` — human attestation
- `unknown` — not established

Assessment outputs and recommendations are stored separately (`calculated`, `recommendation` on evidence/assessment rows) and never treated as discovered fact.

## Azure integration

- Credentials stay **server-side** only (environment variables or managed identity at deploy time).
- `CloudAccount` stores subscription/tenant metadata and a **config reference key** (e.g. `AZURE_PROD`) — not secrets.
- `AzureProviderAdapter` implements `CloudProviderAdapter.discover_resources()`.
- Without configured credentials, discovery returns **zero resources** and records an audit event — **no fabricated Azure data**.

Optional dependencies: `pip install -e ".[azure]"`.

## Resilience assessment

Controls are evaluated per business service (and linked resources) with results: `pass`, `fail`, `partial`, `unknown`, `not_applicable`. **Unknown is never pass.**

## What the platform does NOT claim

- No “DORA Compliant” badge
- No compliance score without documented methodology
- No automatic finding resolution when configuration changes
- No automatic business-service assignment for discovered resources
