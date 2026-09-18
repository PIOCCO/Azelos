# Azure integrations

| Service | Client module | Permission | Data | Refresh |
|---------|---------------|------------|------|---------|
| Resource Graph | `azure/clients/resource_graph.py` | Reader | Resource inventory | On sync |
| Cost Management | `azure/clients/cost_management.py` | Cost Management Reader | Month-to-date spend | On sync |
| Backup (RSV) | Planned | Backup Reader | Protection status | On sync |
| Site Recovery | Planned | Site Recovery Reader | Replication health | On sync |
| Defender for Cloud | Planned | Security Reader | Findings | On sync |
| Azure Monitor | Planned | Monitoring Reader | Metrics / health | Periodic |
| Advisor | Planned | Reader | Recommendations | On sync |

## Identity

Use **DefaultAzureCredential** (Managed Identity in Azure). No client secrets in the app.

## Failure behavior

Live collectors return `errors[]` on the sync run; status becomes **partial** when some APIs fail. Demo mode uses `demo_inventory.json` only.
