# Adding a configurable custom field

## 1. Choose entity type

Must be in the allowlist (`app/domain/entity_types.py`), e.g. `ict_service`, `contract`.

## 2. Admin API

```http
POST /api/organizations/{orgId}/custom-fields
X-Organization-Id: {orgId}
X-User-Role: admin

{
  "entity_type": "ict_service",
  "field_key": "recovery_tier",
  "display_name": "Recovery Tier",
  "field_type": "SELECT",
  "options": ["Tier 1", "Tier 2", "Tier 3"],
  "required": true
}
```

## 3. Store values

```http
POST /api/organizations/{orgId}/custom-field-values
{
  "entity_type": "ict_service",
  "entity_id": "<uuid>",
  "field_key": "recovery_tier",
  "value": "Tier 1"
}
```

Physical table `ict_services` **does not** gain a column.

## 4. Frontend (when built)

Load standard entity → `GET .../custom-fields?entity_type=...` → render dynamic inputs → validate server-side on submit.

## 5. Soft delete

`DELETE .../custom-fields/{id}` sets `active=false` and `deleted_at`; historical `custom_field_values` remain.
