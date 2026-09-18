# Production readiness checklist

| Area | Status | Notes |
|------|--------|-------|
| Security headers / rate limit | PARTIAL | Middleware added; tune limits per tenant |
| Authentication | PARTIAL | JWT dev; Entra stub, production guard enforced |
| Authorization | READY | Role + tenant checks on mutating routes |
| Multi-tenancy | PARTIAL | Tests cover key IDOR paths; expand per endpoint |
| Observability | PARTIAL | Request ID + structured logs; App Insights wiring manual |
| Testing | PARTIAL | Acceptance suite expanded; no frontend unit tests yet |
| Infrastructure | PARTIAL | Terraform MVP + Container Apps Job for scheduled sync |
| Deployment | PARTIAL | deploy/destroy scripts; needs tfvars validation |
| Cost | READY | Budget alerts + COST.md separation |
| Documentation | READY | Core docs present |
| Backup (platform DB) | PARTIAL | PostgreSQL 7-day default |
| DR (platform) | NOT READY | Single-region MVP |
| Azure integrations | PARTIAL | Resource Graph, Cost, Backup (RG), Advisor, Defender (partial); ASR/Monitor planned |
| Reporting | PARTIAL | Branded PDF; content depth growing |
| Demo mode | READY | DEMO_MODE isolated with UI indicator |
| Customer Portal | PARTIAL | Dedicated `/customer` UI + `/api/v1/customer/*` |
| Financial Dashboard | PARTIAL | DB-backed; demo + partial live sync |
| Azure Cost Management | PARTIAL | MTD + daily/service in demo; live on sync |
| Resource Cost Mapping | PARTIAL | Per-resource costs on inventory |
| Budget Monitoring | PARTIAL | TenantSettings + utilization |
| Forecasting | PARTIAL | When Azure returns forecast |
| Cost Anomalies | PARTIAL | Demo records + cost alerts |
| Savings Recommendations | PARTIAL | Recommendation engine |
| Tenant Isolation (customer API) | PARTIAL | Tests on customer + provider paths |

Do not mark **READY** for Entra or full Azure coverage until implemented and tested in a live subscription.
