# Azure integrations

| Service | Client module | Permission | Data | Refresh |
|---------|---------------|------------|------|---------|
| Resource Graph | `azure/clients/resource_graph.py` | Reader | Resource inventory | On sync |
| Cost Management | `azure/clients/cost_management.py` | Cost Management Reader | Month-to-date spend | On sync |
| Backup (RSV) | `azure/clients/backup.py` (Resource Graph) | Backup Reader | VM protection flags | On sync |
| Site Recovery | Planned | Site Recovery Reader | Replication health | On sync |
| Defender for Cloud | `azure/clients/defender.py` | Security Reader | Secure score aggregates | On sync |
| Azure Monitor | Planned | Monitoring Reader | Metrics / health | Periodic |
| Advisor | `azure/clients/advisor.py` | Reader | Cost recommendations | On sync |

## Identity

Use **DefaultAzureCredential** (Managed Identity in Azure). No client secrets in the app.

## Failure behavior

Live collectors return `errors[]` on the sync run; status becomes **partial** when some APIs fail. Demo mode uses `demo_inventory.json` only.
