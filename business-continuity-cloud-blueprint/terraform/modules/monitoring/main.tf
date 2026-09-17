resource "azurerm_resource_group" "monitoring" {
  name     = "${var.name_prefix}-rg-monitoring"
  location = var.location
  tags     = var.tags
}

resource "azurerm_log_analytics_workspace" "main" {
  name                = "${var.name_prefix}-law"
  location            = var.location
  resource_group_name = azurerm_resource_group.monitoring.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = var.tags
}

resource "azurerm_application_insights" "main" {
  name                = "${var.name_prefix}-appi"
  location            = var.location
  resource_group_name = azurerm_resource_group.monitoring.name
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "web"
  tags                = var.tags
}

resource "azurerm_monitor_action_group" "ops" {
  name                = "${var.name_prefix}-ag-ops"
  resource_group_name = azurerm_resource_group.monitoring.name
  short_name          = "bcbpops"
  tags                = var.tags

  email_receiver {
    name          = "ops-email"
    email_address = var.alert_email
  }
}

resource "azurerm_key_vault" "main" {
  name                       = substr(replace("${var.name_prefix}-kv-${random_string.kv_suffix.result}", "-", ""), 0, 24)
  location                   = var.location
  resource_group_name        = azurerm_resource_group.monitoring.name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  soft_delete_retention_days = 90
  purge_protection_enabled   = true
  enable_rbac_authorization  = true
  tags                       = var.tags
}

data "azurerm_client_config" "current" {}

resource "random_string" "kv_suffix" {
  length  = 6
  lower   = true
  upper   = false
  numeric = true
  special = false
}

resource "azurerm_role_assignment" "deployer_kv_admin" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Administrator"
  principal_id         = data.azurerm_client_config.current.object_id
}
