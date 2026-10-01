# DORA Blueprint — Pilot delivery pack

This folder contains everything needed to **hand the existing product to a pilot financial entity** without expanding DORA scope.

| Document | Purpose |
|----------|---------|
| [INSTALL-AND-USE.md](./INSTALL-AND-USE.md) | **Full install + step-by-step user guide** |
| [OPERATOR-RUNBOOK.md](./OPERATOR-RUNBOOK.md) | First pilot: deploy, bootstrap, verify |
| [CUSTOMER-RUNBOOK.md](./CUSTOMER-RUNBOOK.md) | Task-oriented customer pilot steps |
| [PILOT-READINESS-AUDIT.md](./PILOT-READINESS-AUDIT.md) | WORKS / gaps / blockers classification |
| [PILOT-EXPERIMENT.md](./PILOT-EXPERIMENT.md) | Hypothesis and validation questions |
| [BASELINE-MEASUREMENT.md](./BASELINE-MEASUREMENT.md) | Baseline vs end metrics sheet |
| [USAGE-OBSERVATION.md](./USAGE-OBSERVATION.md) | Non-invasive usage logging |
| [WEEKLY-REVIEW-TEMPLATE.md](./WEEKLY-REVIEW-TEMPLATE.md) | Weekly pilot standup |
| [END-OF-PILOT-REVIEW.md](./END-OF-PILOT-REVIEW.md) | Final comparison template |
| [CUSTOMER-INTERVIEW-GUIDE.md](./CUSTOMER-INTERVIEW-GUIDE.md) | Neutral interview questions |
| [PILOT-DECISION-FRAMEWORK.md](./PILOT-DECISION-FRAMEWORK.md) | Evidence buckets for go/next |
| [NEXT-DEVELOPMENT-RULE.md](./NEXT-DEVELOPMENT-RULE.md) | When to build after pilot |
| [PILOT-PRODUCT-DEFINITION.md](./PILOT-PRODUCT-DEFINITION.md) | What the customer buys, scope, responsibilities |
| [ONBOARDING.md](./ONBOARDING.md) | Platform operator + customer administrator procedures |
| [DEMO-SCENARIO.md](./DEMO-SCENARIO.md) | Live demonstration walkthrough (Nordhaven demo tenant) |
| [PILOT-BOUNDARY.md](./PILOT-BOUNDARY.md) | Included vs not supported |
| [SUCCESS-METRICS.md](./SUCCESS-METRICS.md) | Measurable pilot outcomes |
| [FEEDBACK.md](./FEEDBACK.md) | Instrumentation + questionnaire |
| [COMMERCIAL-PACKAGE.md](./COMMERCIAL-PACKAGE.md) | Pilot package shape (no fixed pricing) |
| [ACCEPTANCE-CHECKLIST.md](./ACCEPTANCE-CHECKLIST.md) | Go / no-go checklist |

**Customer-facing guides**

| Document | Audience |
|----------|----------|
| [customer/GETTING-STARTED.md](./customer/GETTING-STARTED.md) | First login and configuration |
| [customer/OPERATING.md](./customer/OPERATING.md) | Day-to-day use of registers and reports |
| [customer/ADMINISTRATION.md](./customer/ADMINISTRATION.md) | Users, roles, invitations, storage |
| [customer/DEPLOYMENT.md](./customer/DEPLOYMENT.md) | Environment, Docker, health, backups |

**Scripts (pilot / demo environments only)**

```bash
cd backend
python scripts/bootstrap_platform_operator.py --email you@company.example --password '...'
python scripts/seed_pilot_demo.py   # fictional Nordhaven tenant — not for production customer DBs
```

Do **not** run `seed_pilot_demo.py` or `seed_dev.py` on a production database that holds real customer tenants unless you intend to add demo data to that same instance.
