# API

Base: `/api/v1`

| Endpoint | Auth | Description |
|----------|------|-------------|
| POST `/auth/login` | public | JWT login |
| GET `/health` | public | Liveness |
| GET `/ready` | public | DB ready |
| GET `/documents` | user | List accessible documents |
| POST `/documents/upload` | admin/manager | Upload + queue ingest |
| PUT `/documents/{id}/permissions` | admin | ACL |
| DELETE `/documents/{id}` | admin | Delete + deactivate vectors |
| POST `/chat/query` | user | RAG Q&A + citations |
| GET `/admin/usage` | admin | Usage stats |
| GET `/audit` | admin | Audit log |

OpenAPI: `/docs` when API running.
