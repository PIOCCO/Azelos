resource "random_string" "acr_suffix" {
  length  = 5
  lower   = true
  upper   = false
  numeric = true
  special = false
}

resource "azurerm_container_registry" "this" {
  name                = substr(replace("${var.name_prefix}acr${random_string.acr_suffix.result}", "-", ""), 0, 50)
  resource_group_name = var.resource_group_name
  location            = var.location
  sku                 = var.sku
  admin_enabled       = var.admin_enabled
  tags                = var.tags
}
