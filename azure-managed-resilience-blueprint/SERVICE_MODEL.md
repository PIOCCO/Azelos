# Service model (no fixed pricing)

Components you can package into tiers:

- **Setup** — Lighthouse onboarding, baseline discovery, recovery objectives
- **Infrastructure monitoring** — health, availability, alerts
- **Backup monitoring** — coverage, failures, retention
- **DR monitoring** — ASR replication, RPO/RTO tracking
- **Security monitoring** — Defender findings, exposure checks
- **FinOps** — cost trends, anomalies, optimization recommendations
- **Monthly report** — PDF/markdown executive summary
- **Incident response** — alert triage (human)
- **Infrastructure changes** — approved runbooks only
- **DR testing** — isolated restore tests (non-production)

Example tiers (conceptual):

- Monitoring  
- Monitoring + Backup  
- Monitoring + Backup + Security  
- Fully Managed Azure  

Configure entitlements per tenant in PostgreSQL (`tenants` + future `service_plans` table).
