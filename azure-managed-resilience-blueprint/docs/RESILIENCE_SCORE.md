# Resilience score

Transparent 0–100 score computed in `app/services/resilience_score.py`.

## Factors (weights)

| Factor | Weight | Meaning |
|--------|--------|---------|
| backup_coverage | 25 | % VMs with backup_protected |
| backup_freshness | 15 | % VMs with last_backup_at set |
| dr_coverage | 20 | ASR protected VMs vs VM count (capped at 100%) |
| dr_replication_health | 15 | healthy / protected from latest DR snapshot |
| security_posture | 15 | Penalty for critical/high findings (cap 10) |
| monitoring_coverage | 10 | Resources with health != unknown |

**Score** = sum(weight × factor) where each factor is 0.0–1.0.

The dashboard shows each factor as a percentage and the weight used. Open critical alerts are listed separately and do not hidden-adjust the score.
