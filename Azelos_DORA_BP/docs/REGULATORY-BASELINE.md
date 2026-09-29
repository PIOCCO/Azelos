# Regulatory baseline vs organization configuration

## Baseline (immutable)

| Table | Purpose |
|-------|---------|
| `dora_domains` | DORA domain catalogue |
| `dora_requirements` | Requirement definitions (`system_immutable=true`) |
| `dora_control_definitions` | Contractual control themes (existing supplier BP) |
| `platform_modules` | Feature modules (`system_defined=true`) |

Customers **cannot** delete or alter baseline rows through the configuration API.

## Organization layer

| Table | Purpose |
|-------|---------|
| `organization_modules` | Enabled modules per `financial_entity` (organization) |
| `organization_requirements` | Applicability, status, owner, notes |
| `contract_dora_controls` | Per-contract control **implementation** (existing) |
| `custom_field_definitions` / `custom_field_values` | Extra attributes without DDL |

```text
DORA Requirement (baseline)
        ↓
Organization Requirement (applicable, status, owner)
        ↓
Evidence / controls (existing domain tables)
```

## Tenant key

**Organization ID** in the API equals `financial_entities.id`.
