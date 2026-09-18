# Cost model

## 1. Development platform (~$200 credit)

| Resource | Est. monthly | Reduce |
|----------|-------------|--------|
| Container Apps (min 0) | $5–20 | Scale to zero |
| PostgreSQL B1ms | $25–35 | Destroy when idle |
| ACR Basic | ~$5 | — |
| Log Analytics | $5–15 | 30d retention |
| Key Vault / Storage | ~$2 | — |

Subscription budget alerts at 50/75/90% of $200.

## 2. Production platform (operator cost)

Same components at slightly higher utilization — still no AKS/GPU. Expect roughly **$80–150/month** per operator environment at small scale.

## 3. Customer Azure consumption

Monitored spend inside customer subscriptions is **their** bill — shown in FinOps dashboards, not mixed with platform hosting cost.

## Safeguards

- `BUDGET_*` env thresholds for in-app warnings
- Optional demo VM environment — deallocate when not testing live discovery
- `scripts/destroy.sh` for dev teardown (type `destroy` to confirm)
