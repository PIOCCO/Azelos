# Read live ACR admin credentials (works after `az acr update --admin-enabled true` or Terraform enable).
data "azurerm_container_registry" "acr_credentials" {
  count = var.acr_admin_enabled ? 1 : 0

  name                = module.container_registry.name
  resource_group_name = module.resource_group.name

  depends_on = [module.container_registry]
}
