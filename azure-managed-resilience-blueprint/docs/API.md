# API (v1)

Base path: `/api/v1`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness |
| POST | `/auth/login` | Dev JWT login |
| GET | `/customers` | List tenants (provider) |
| GET | `/dashboard/overview` | Summary KPIs |
| GET | `/resources` | Inventory |
| POST | `/sync` | Discovery + checks |
| GET | `/backups` | Backup coverage |
| GET | `/disaster-recovery` | ASR snapshot |
| GET | `/security` | Findings |
| GET | `/costs` | FinOps snapshot |
| GET | `/alerts` | Active alerts |
| GET | `/recommendations` | Evidence-based items |
| POST | `/recommendations/{id}/approve` | Approve action |
| POST | `/recommendations/{id}/execute` | Record execution |
| GET | `/reports/monthly?format=json\|markdown\|pdf` | Monthly report |
| GET | `/audit-logs` | Audit trail |

All tenant-scoped routes accept `tenant_id` for provider users.
