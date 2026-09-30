# Relationship graph — pre-implementation assessment

## 1. Existing entities (PostgreSQL)

| Entity | Table |
|--------|--------|
| Organization | `financial_entities` |
| Business function | `business_functions` |
| Information asset | `information_assets` |
| ICT asset | `ict_assets` |
| ICT service | `ict_services` |
| ICT provider | `ict_providers` |
| Contract | `contracts` |
| Subcontractor | `subcontractors` |
| Risk assessment | `risk_assessments` |
| DORA control (catalogue) | `dora_control_definitions` |
| Contract control | `contract_dora_controls` |
| Evidence | `evidence` |
| Evidence ↔ control | `evidence_control_links` |
| Business service (resilience) | `business_services` |
| Cloud resource | `cloud_resources` |
| Service dependency | `service_dependencies` |
| Resilience finding | `resilience_findings` |
| Remediation action | `remediation_actions` |

**Not modeled (501 / absent):** Incident, BCP, DR plan, standalone “critical function” table, resilience test records.

## 2. Existing relationships

- Business function ↔ ICT asset: `asset_function_maps` (`SUPPORTS`, `supports_critical_function`)
- Business function ↔ ICT service: `function_service_mappings` (`SUPPORTS`)
- Information asset ↔ ICT asset: FK on `ict_assets.information_asset_id` (`REALIZED_BY`)
- ICT service → contract: FK (`UNDER_CONTRACT`)
- Contract → provider: FK (`PROVIDED_BY`)
- Contract → services, controls, risks
- Risk → provider / contract / service (optional FKs)
- Control definition ↔ contract control ↔ evidence links
- Provider → subcontractors (tree)
- Business service ↔ cloud resource, dependencies, findings, remediation

## 3. Existing APIs

REST `/api/v1/*` for CRUD lists; no graph aggregation.

## 4. Missing relationships (not in DB)

Incident chains, BCP/DR, BIA entities, ICT asset → service direct link, corrective action separate from `remediation_actions`.

## 5. GraphQL approach

**Strawberry** on FastAPI at `/graphql`, read-only queries, shared JWT org context. Service → repository BFS with depth/node caps.

## 6. Visualization

**React Flow** (`@xyflow/react`) — React 18 compatible, pan/zoom, custom nodes, enterprise-friendly.
