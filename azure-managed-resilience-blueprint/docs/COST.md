# Cost guide (~$200 MVP credit)

| Resource | SKU (default) | Est. monthly | Reduce cost | Shut down |
|----------|---------------|-------------|-------------|-----------|
| Container Apps (API + UI) | 0.25 vCPU, min 0 replicas | ~$5–20 | `min_replicas = 0` | Stop revisions / destroy env |
| PostgreSQL Flexible | B_Standard_B1ms | ~$25–35 | Burstable B1ms, 32GB storage | `terraform destroy` |
| ACR Basic | Basic | ~$5 | Single repo tags | Delete registry |
| Log Analytics | Pay-as-you-go, 30d retention | ~$5–15 | Lower retention, sampling | Disable App Insights |
| Storage (reports) | LRS Standard | ~$1–3 | Lifecycle rules | Delete account |
| Key Vault | Standard | ~$1 | Few secrets | Delete vault |

**Budget safeguards** (Terraform `monitoring` module): subscription budget at **$200** with email alerts at 50%, 75%, 90%. Application env vars mirror thresholds (`BUDGET_*`).

**Do not** run AKS, large VMs, or Premium PostgreSQL in the MVP stack.

**Optional demo customer resources** (2–3 small VMs) are documented in `terraform/demo-environment/` — deploy only when validating live discovery; keep stopped when idle.
