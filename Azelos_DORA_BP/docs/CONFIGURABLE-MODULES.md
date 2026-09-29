# Adding a new platform module

1. Add a row via **new Alembic migration** (do not use runtime DDL):

```sql
INSERT INTO platform_modules (id, key, name, description, system_defined, ...)
VALUES (...);
```

2. Use a stable `key` (e.g. `RESILIENCE_TESTING`).

3. Gate application features with a service check:

```python
organization_has_module(session, financial_entity_id, "RESILIENCE_TESTING")
```

4. Organizations enable/disable via:

- `POST /api/organizations/{id}/modules/{moduleKey}/enable`
- `POST /api/organizations/{id}/modules/{moduleKey}/disable`

Only keys present in `platform_modules` are valid (no arbitrary module names).
