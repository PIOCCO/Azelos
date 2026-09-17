# Client Delivery Guide (Freelance)

## Productized workflow

```
CLIENT
  → Collect requirements / BIA workshop
  → Configure client.yaml + critical-assets.yaml
  → terraform plan (review RTO/RPO validation output)
  → terraform apply (dev → production)
  → Configure monitoring alerts + action groups
  → Test backup (scripts/backup.sh)
  → Test restore (dry-run then sandbox)
  → Test failover/failback (dry-run → controlled drill)
  → Generate readiness report (scorecard + recovery-test-report.json)
  → Deliver runbooks + docs + evidence package
```

## Onboarding checklist

- [ ] Executive sponsor and technical owner identified
- [ ] `client.yaml` completed (regions, profile, contacts)
- [ ] BIA signed (`business-continuity/business-impact-analysis.md`)
- [ ] Critical assets and dependencies documented
- [ ] RTO/RPO validation reviewed (no false PASS)
- [ ] Azure subscription + state backend configured
- [ ] Terraform applied to dev, then production
- [ ] Monitoring alerts routed to client channel
- [ ] Recovery test executed and report archived
- [ ] Failover/failback drill executed or scheduled
- [ ] Client ops trained on runbooks
- [ ] Handover: `readiness-report.json`, timelines, limitations

## Cost conversation

Use profiles in `docs/architecture.md`:

- **minimal**: lowest always-on; longer RTO/RPO
- **standard**: GRS + active-passive DR storage
- **resilient**: geo DB backup + optional standby compute

Document drivers — do not quote exact Azure bills.

## Limitations

- Active-active not included by default
- DNS/traffic manager records are client-specific (not auto-switched)
- Tested RTO/RPO require real drills — automation provides estimated capability only
