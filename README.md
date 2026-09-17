# Azelos — Cloud Blueprints (Monorepo)

Independent, reusable freelance deployment products — each in its own folder:

| Blueprint | Folder | Purpose |
|-----------|--------|---------|
| **Business Continuity & Disaster Recovery** | [`business-continuity-cloud-blueprint/`](business-continuity-cloud-blueprint/) | Azure BCDR, RTO/RPO, backup/restore, failover |
| **Web Hosting** | [`web-hosting-blueprint/`](web-hosting-blueprint/) | Docker Compose hosting for client apps (VPS / VM) |

Projects are **deployable separately**. Optional integration: Web Hosting exports `exports/inventory.json` for BCDR consumption — no shared runtime required.

## Quick links

- BCDR: `business-continuity-cloud-blueprint/README.md`
- Hosting: `web-hosting-blueprint/README.md`
