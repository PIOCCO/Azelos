# Frontend (not yet implemented)

The DORA Blueprint folder is **API-first**. Configuration is available via FastAPI:

- Base app: `app.api.main:app`
- Run: `uvicorn app.api.main:app --reload` from `backend/` with `DATABASE_URL` set

## Planned admin UI

1. **Modules** — list `GET /api/config/modules`, toggle enable/disable.
2. **Custom fields** — CRUD on `/api/organizations/{id}/custom-fields`.
3. **Dynamic entity forms** — fetch definitions per `entity_type`, merge with standard fields, post values to `/custom-field-values`.

See `docs/CONFIGURABLE-FIELDS.md` for the intended dynamic form flow.

No React app ships in this increment; use API tests and OpenAPI at `/docs` when the server is running.
