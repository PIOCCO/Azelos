# Azelos — Cloud Blueprints (Monorepo)

Independent, reusable freelance deployment products — each in its own folder:

| Blueprint | Folder | Purpose |
|-----------|--------|---------|
| **Business Continuity & Disaster Recovery** | [`business-continuity-cloud-blueprint/`](business-continuity-cloud-blueprint/) | Azure BCDR, RTO/RPO, backup/restore, failover |
| **Web Hosting** | [`web-hosting-blueprint/`](web-hosting-blueprint/) | Docker Compose hosting for client apps (VPS / VM) |
| **SOC 2 Compliance** | [`soc2-cloud-blueprint/`](soc2-cloud-blueprint/) | SOC 2 readiness, controls, evidence, continuous monitoring |
| **Private Company AI** | [`private-ai-cloud-blueprint/`](private-ai-cloud-blueprint/) | RAG + private LLM, admin/employee apps, document ACLs |

Projects are **deployable separately**. Optional integrations use exported inventory/evidence JSON — no shared runtime required.

## Quick links

- BCDR: `business-continuity-cloud-blueprint/README.md`
- Hosting: `web-hosting-blueprint/README.md`
- SOC 2: `soc2-cloud-blueprint/README.md`
- Private AI: `private-ai-cloud-blueprint/README.md`
