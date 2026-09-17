# Business Impact Analysis (BIA) — Template

Use this document with `critical-assets.yaml`, `rto-rpo.yaml`, and `dependency-map.yaml` during client onboarding.

## Purpose

Identify which services must continue (business continuity) versus which can be restored after disruption (disaster recovery), and quantify impact if unavailable.

## Distinctions (required)

| Concept | Definition in this blueprint |
|--------|------------------------------|
| **High Availability** | Redundancy within a region to survive component failure without full recovery |
| **Backup** | Point-in-time copies for restore; does not keep service online |
| **Disaster Recovery** | Procedures and secondary capacity to restore service after major failure |
| **Business Continuity** | Ability to maintain critical operations (people, process, alternate workflows, degraded modes) |
| **Incident Response** | Security-focused detect/contain/eradicate/recover for compromise |

Backups alone **do not** provide business continuity.

## BIA worksheet

1. List revenue-critical workflows and owners.
2. Map each workflow to technical services in `critical-assets.yaml`.
3. Set RTO/RPO per service (client-owned values).
4. Run `python3 automation/bcdr/validate_rto_rpo.py` — review estimated capability vs targets.
5. Schedule `scripts/recovery-test.sh` to populate **tested results**.

## Impact categories

- **Financial**: lost transactions, SLA credits, churn
- **Operational**: manual workarounds, support load
- **Regulatory**: reporting deadlines, data residency
- **Reputational**: public status page, communications plan

## Sign-off

| Role | Name | Date |
|------|------|------|
| Executive sponsor | | |
| Product owner | | |
| Engineering lead | | |
| Security | | |
