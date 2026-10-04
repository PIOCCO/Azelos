# Container Apps environment — VNet / subnet errors

## Dev workaround (no custom VNet)

If a **fresh** apply still fails with `Invalid vnet resource ID` after correct `/21` subnet + delegation + no NSG, your subscription/region may block **custom VNet** Container Apps environments.

For **dev only**, disable VNet integration (Container Apps managed network + PostgreSQL public with firewall):

In `environments/dev/terraform.tfvars`:

```hcl
integrate_container_apps_with_vnet = false
```

Then `terraform destroy` + `terraform apply` (PostgreSQL must be recreated — no data to keep).

**Not for production** — use private VNet + private PostgreSQL in staging/prod when CAE VNet works in your tenant.

Express environments also **cannot** use `keyVaultUrl` on Container App secrets. With `integrate_container_apps_with_vnet = false`, Terraform injects `DATABASE_URL` and `JWT_SECRET_KEY` as inline app secrets (values still originate from Key Vault resources in Terraform state — not ideal for prod).

---

## Symptom

`ManagedEnvironmentInvalidNetworkConfiguration: Invalid vnet resource ID provided, or the virtual network could not be found`

Often after **deleting `snet-containerapps` manually** while Terraform state still references the old subnet ID.

## Fix (dev, keep PostgreSQL)

From `infra/terraform/environments/dev`:

```bash
# 1) Confirm VNet exists
az network vnet show -g dora-bp-dev-rg -n dora-bp-dev-vnet -o table

# 2) Drop stale resources from state (safe if subnet was deleted in Portal/CLI)
terraform state rm 'module.platform.module.networking.azurerm_subnet_network_security_group_association.container_apps' 2>/dev/null || true
terraform state rm 'module.platform.module.networking.azurerm_subnet.container_apps' 2>/dev/null || true
terraform state rm 'module.platform.module.compute.azurerm_container_app_environment.this' 2>/dev/null || true
terraform state rm 'module.platform.module.compute.azurerm_container_app.app' 2>/dev/null || true

# 3) Recreate subnet, then CAE
terraform apply -var-file=terraform.tfvars \
  -target='module.platform.module.networking.azurerm_subnet.container_apps' \
  -target='module.platform.module.networking.azurerm_subnet_network_security_group_association.container_apps'

# 4) Full apply
terraform apply -var-file=terraform.tfvars
```

Verify subnet before step 4:

```bash
SUBNET_ID=$(terraform state show -no-color 'module.platform.module.networking.azurerm_subnet.container_apps' | awk '/^    id /{print $3}')
az network vnet subnet show --ids "$SUBNET_ID" \
  --query "{prefix:addressPrefix, delegations:delegations}" -o json
```

Workload-profiles environment (azurerm ~4.14): prefix must be **`/21` or larger** (e.g. `10.40.8.0/21`), **delegated** to `Microsoft.App/environments`, and the environment must define a **`Consumption` workload profile**.

## Subnet design (this repo)

- `snet-containerapps`: `/21`, delegated to `Microsoft.App/environments`
- `snet-postgresql`: `/24`, delegated to PostgreSQL Flexible Server

If you previously imported a `/23` subnet without delegation, **delete** `snet-containerapps` (when no CAE exists), remove it from Terraform state, and apply again so the subnet is recreated at `/21`.

## NSG on the infrastructure subnet

An **empty NSG associated** with `snet-containerapps` often produces `Invalid vnet resource ID` / invalid network configuration. This repo **no longer associates** an NSG with that subnet by default.

If your subnet still has an NSG (Portal or earlier apply):

```bash
az network vnet subnet update -g dora-bp-dev-rg --vnet-name dora-bp-dev-vnet -n snet-containerapps \
  --remove networkSecurityGroup 2>/dev/null || \
az network vnet subnet update -g dora-bp-dev-rg --vnet-name dora-bp-dev-vnet -n snet-containerapps --network-security-group ""
```

Remove stale association from Terraform state:

```bash
terraform state rm 'module.platform.module.networking.azurerm_subnet_network_security_group_association.container_apps' 2>/dev/null || true
terraform apply -var-file=terraform.tfvars
```

## Confirm Terraform uses the same subnet ID as Azure

```bash
terraform state show 'module.platform.module.networking.azurerm_subnet.container_apps' | grep '^    id '
az network vnet subnet show -g dora-bp-dev-rg --vnet-name dora-bp-dev-vnet -n snet-containerapps --query id -o tsv
```

IDs must match exactly.

## Azure CLI smoke test (clearer errors than Terraform)

```bash
SUBNET_ID=$(az network vnet subnet show -g dora-bp-dev-rg --vnet-name dora-bp-dev-vnet -n snet-containerapps --query id -o tsv)
az containerapp env create -g dora-bp-dev-rg -n cae-smoke-test --location spaincentral \
  --infrastructure-subnet-resource-id "$SUBNET_ID" \
  --logs-workspace-id "<log-analytics-id>" \
  --enable-workload-profiles
# delete smoke env after: az containerapp env delete ...
```
