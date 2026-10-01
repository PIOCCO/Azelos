# Pilot boundary

| Area | Included in pilot BP | Customer responsibility | Not supported |
|------|----------------------|-------------------------|---------------|
| DORA operational registers | Provider, contract, service, function, asset registers; dependency links | Accurate, complete data entry | Regulator-formatted filing packs |
| ICT third-party management | Provider status, contracts, sub-outsourcing UI where implemented | Vendor management decisions | Automated vendor due diligence |
| Risk management | Dimensional assessments, calculated levels, history | Risk judgement, treatment, acceptance | Enterprise risk framework outside ICT |
| Requirements tracking | Baseline catalogue per org, status, owners, notes | Applicability decisions | Legal mapping to every RTS article |
| Evidence | Upload, metadata, download, requirement links, expiry fields | Valid documents, retention policy | eDiscovery or WORM legal hold |
| Incidents | ICT incident register, severity, links to entities | Actual IR runbooks and comms | 24/7 SOC service |
| Resilience testing | Tests, BCP/DR plans, related resilience hub pages | Test execution, results validation | Physical DR execution |
| Reporting | In-app resilience/DORA reports from tenant data | Interpretation for committees | Signed audit reports |
| Relationship map | Graph from tenant links | Keeping links current | Persistent custom layout (session-only drag) |
| Exports | CSV / tenant ZIP | Secure handling of exports | BI warehouse sync |
| Regulatory interpretation | — | Internal/compliance counsel | Product does not interpret law |
| Legal assessment | — | Customer legal | — |
| Certification | — | — | No certification offered |
| Infrastructure | App binaries, migrations, health endpoints | DB, storage, TLS, backups, patching | Azelos does not host unless contracted |
| Integrations | REST + GraphQL (auth required) | Build/maintain integrations | Pre-built ERP/ServiceNow connectors |
| User management | Invites, roles (RBAC) | Access reviews, offboarding | Enterprise IAM beyond email/password/OIDC config |
| Multi-tenant SaaS | Isolated tenants on shared instance | — | Cross-tenant analytics |
| AI / automation | — | — | Not sold unless explicitly implemented |

**Plain-language disclaimer for customers:** The Blueprint is a **system of record and oversight** for ICT resilience operations. It does **not** replace legal, regulatory, internal audit, or external audit judgement.
