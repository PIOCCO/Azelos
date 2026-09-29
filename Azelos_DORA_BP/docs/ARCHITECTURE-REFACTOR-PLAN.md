# Architecture refactor plan (2026-09)

## Inspection summary

| Target layer | Current state |
|--------------|---------------|
| **dora_core** | Single `public` schema: `financial_entities`, `business_functions`, `ict_providers`, `contracts`, `ict_services`, `risk_assessments`, `evidence`, DORA baseline (`dora_domains`, `dora_requirements`), `organization_requirements` |
| **dora_config** | `platform_modules`, `organization_modules`, `organization_settings`, custom fields, `configuration_audit_log`; PG schemas `dora_core`/`dora_config` created in 006 (mostly empty) |
| **client_extensions** | `extension_registrations` (metadata only) |
| **Sector DBs** | **None** — no bank/insurance split |
| **FastAPI** | v1 JWT layer + legacy header config |
| **Gap** | No `organization_profiles`, no rule engine, no `ict_assets` / asset–function maps, partial v1 config |

## This increment (no sector DBs, no dynamic DDL)

1. Add `organization_profiles` (1:1 with `financial_entities`) with controlled enums.
2. Add `dora_config.profile_rules` + seed rules; central `ApplicabilityService`.
3. Add `ict_assets`, `information_assets`, `asset_function_maps` (inherent vs function criticality).
4. v1 APIs: profile, applicability, org requirements; expand config (modules/custom-fields/settings).
5. `ICTAssetService` + routes; remove 501 stub for `/ict-assets` list/create.
6. Tests + `docs/ARCHITECTURE.md`.

Naming: **organization** API = `financial_entities` row (unchanged table name).
