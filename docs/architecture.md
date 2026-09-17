# Architecture

## Reference topology

```
PRIMARY AZURE REGION (active)
├── VNet + subnets (app, data)
├── Linux App Service (application/API)
├── PostgreSQL Flexible Server
├── Storage Account (LRS or GRS by profile)
├── Key Vault (secrets, DB password)
├── Log Analytics + Application Insights
├── Recovery Services Vault (backup policies)
└── Automation scripts / runbooks

        │ backup / GRS replication / geo-redundant DB backup (resilient)
        ▼

SECONDARY AZURE REGION (passive / standby)
├── Recovery resource group
├── Recovery storage (artifacts)
└── Optional standby App Service (resilient profile or standby_compute)
```

## Models

| Model | Description | Default |
|-------|-------------|---------|
| **Active-active** | Dual live regions, synchronous/async replication | Not default (higher cost/complexity) |
| **Active-passive** | Primary serves traffic; secondary provisioned/scaled on DR | **Default** |
| **Backup/restore** | No hot standby; restore from backup | `minimal` profile |

## Distinctions

- **HA**: Survives single component failure in-region (zone redundancy where enabled).
- **Backup**: Offline copies; supports RPO if intervals align — does not keep service online.
- **DR**: Documented procedures + secondary region capacity to restore service.
- **BC**: People/process/degraded modes — not fully automated by this repo.
- **IR**: Security incidents (ransomware) — contain first, then DR rebuild.

## Multi-cloud path

Modules isolate Azure resources; `client.yaml` `cloud.provider` allows future AWS/GCP modules mirroring interfaces (`networking`, `database`, etc.).

## Profiles

See `business-continuity/architecture-capabilities.yaml` and `docs/deployment.md`.

## Cost control (estimates, not quotes)

| Cost driver | minimal | standard | resilient |
|-------------|---------|----------|-----------|
| Always-on compute | Small App Service (B1) | P1v3 | P1v3 + optional DR B1 |
| Database | Burstable B1ms | GP D2s | GP + geo-redundant backup |
| Storage replication | LRS | GRS | GRS |
| Secondary region | Recovery storage only | Recovery storage | Storage + standby app |
| Monitoring | Log Analytics ingestion | Same | Same + more alerts |
| Backup | RSV + retention storage | Same | Same + cross-region copy |

Use `client.yaml` `cloud.profile` to select. Recovery-region compute stays off or minimal until failover.
