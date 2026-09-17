# Runbook: Ransomware / Compromised Production

| Field | Value |
|-------|--------|
| Severity | SEV-0 |
| Type | Incident Response + DR |
| Runbook ID | RB-SEC-001 |

## Detection

- EDR alert, mass encryption, anomalous backup deletion attempts
- Immutable backup lock violations logged

## Containment (Incident Response)

1. Isolate affected networks / disable compromised credentials.
2. Do **not** pay ransom as policy (document client decision tree).
3. Preserve evidence — snapshot logs to `compliance/evidence/` (client process).

## Decision point

- Known clean backup + immutable copy → rebuild environment
- Unknown compromise depth → greenfield recovery region

## Recovery (Disaster Recovery — not BC alone)

```bash
export BCBP_DRY_RUN=true
./scripts/failover.sh --dry-run
# After IR clearance:
./scripts/failover.sh   # requires YES confirmation
./scripts/restore.sh <known-good-recovery-point>
```

Rotate all secrets in Key Vault; assume production secrets untrusted.

## Validation

- Malware scan on restored artifacts
- Full health check + penetration spot checks

## Post-recovery

- MFA enforcement review (`docs/security.md`)
- Update control mapping evidence

## Evidence

- IR timeline, backup immutability audit, recovery reports
