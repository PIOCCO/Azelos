# Container Apps environment — VNet / subnet errors

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

Consumption-only: prefix must be **/23 or larger**, **delegations: []**.

## Subnet design (this repo)

- `snet-containerapps`: `/23`, **no** delegation
- `snet-postgresql`: delegated to PostgreSQL Flexible Server

Pull latest `modules/networking/main.tf` if your copy still delegates `Microsoft.App/environments` on the Container Apps subnet.
