# Azure auth for Cloud Agents

Cloud Agent VMs are **isolated**. Logging in with `az login` on your laptop does **not** carry over to the agent.

## Verify context (agent terminal)

```bash
az account show --query "{subscriptionId:id, name:name, tenantId:tenantId, user:user.name}" -o table
```

If this fails, use one of the options below.

## Option A — Device code (human login once per agent session)

```bash
az login --use-device-code
```

Open the URL shown, enter the code, and select the same subscription you use locally.

## Option B — Service principal via environment secrets (recommended for automation)

In [Cloud Agent environment settings](https://cursor.com/docs/cloud-agent/settings), add **secrets** (never commit these):

| Secret | Purpose |
|--------|---------|
| `AZURE_CLIENT_ID` | App registration client ID |
| `AZURE_CLIENT_SECRET` | Client secret |
| `AZURE_TENANT_ID` | Directory tenant ID |
| `AZURE_SUBSCRIPTION_ID` | Target subscription |

Grant the principal **Contributor** (or narrower custom roles) on the subscription or resource group, plus ability to create role assignments if Terraform manages RBAC.

Deploy scripts call `try_az_login_from_env` in `scripts/azure/common.sh` before any Azure API use.

## After auth

```bash
cd Azelos_DORA_BP
./scripts/azure/inspect-subscription.sh
./scripts/azure/deploy-dev.sh
```

See `scripts/azure/README.md` and `infra/terraform/README.md`.
