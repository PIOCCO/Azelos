# Business Continuity Plan — Operational Summary

## Scope

SaaS production on Azure (primary region) with DR in secondary region per `client.yaml`.

## Default posture

- **HA**: Zone-redundant options where profile allows (App Service, PostgreSQL)
- **DR**: Active-passive — secondary recovery infrastructure provisioned or scaled during incident
- **Backup/restore**: Azure Backup + native DB backups + IaC in Git

## Activation criteria

Activate DR runbooks when:

- Primary region unavailable > declared RTO investigation window
- Data corruption or ransomware with integrity loss
- Loss of production database without online replica

## Degraded operations (BC)

Document client-specific manual procedures:

- Status page updates
- Read-only mode
- Payment processor failover (external)
- Support queue staffing

## Communication

- Incident commander assignment
- Customer notification templates (client-owned)
- Internal war room channel

## Recovery validation

Before declaring "restored":

1. `scripts/health-check.sh` — no FAIL on critical checks
2. Recovery test or targeted validation completed
3. `automation/bcdr/scorecard.py` — review open FAIL/WARNING items
4. Post-incident timeline archived under `reports/incidents/`
