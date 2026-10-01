# Final pilot acceptance checklist

Copy into a pilot runbook and tick when evidenced.

## Technical

- [ ] Deployment verified (Docker or customer host) — `/health` 200
- [ ] Database persistence verified (restart test)
- [ ] Backups understood (PostgreSQL + evidence storage)
- [ ] Authentication verified (login, 401 without token)
- [ ] Tenant isolation verified (tests or IDOR checks)
- [ ] Evidence storage verified (upload, download, survive restart)
- [ ] Health/readiness verified (`/ready` schema OK)

## Product

- [ ] Customer onboarding works (provision → ORG_ADMIN login)
- [ ] Main workflow works (provider → contract → service → function → risk → evidence)
- [ ] Reports work (tenant data)
- [ ] Exports work (CSV / ZIP)
- [ ] Relationship map works (graph from links)
- [ ] No critical mock functionality in customer tenant path

## Customer

- [ ] Target customer identified
- [ ] Buyer identified (budget owner)
- [ ] Daily user identified (role name)
- [ ] Customer prerequisites documented
- [ ] Onboarding documented ([ONBOARDING.md](./ONBOARDING.md))
- [ ] Product boundary documented ([PILOT-BOUNDARY.md](./PILOT-BOUNDARY.md))

## Pilot

- [ ] Demo tenant prepared (optional: [DEMO-SCENARIO.md](./DEMO-SCENARIO.md))
- [ ] Pilot scenario prepared (customer-specific chain)
- [ ] Success metrics defined ([SUCCESS-METRICS.md](./SUCCESS-METRICS.md))
- [ ] Feedback process defined ([FEEDBACK.md](./FEEDBACK.md))
- [ ] Support process defined (channel, hours, severity)
