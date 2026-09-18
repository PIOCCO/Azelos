# Secondary-region recovery footprint — minimal always-on cost; scale/provision on failover.

resource "azurerm_resource_group" "recovery" {
  name     = "${var.name_prefix}-rg-recovery"
  location = var.location
  tags     = merge(var.tags, { role = "dr-secondary" })
}

resource "azurerm_storage_account" "recovery" {
  name                     = substr(replace("${var.name_prefix}dr${random_string.dr_sa.result}", "-", ""), 0, 24)
  resource_group_name      = azurerm_resource_group.recovery.name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "GRS"
  min_tls_version          = "TLS1_2"
  tags                     = var.tags
}

resource "azurerm_storage_container" "recovery_artifacts" {
  name                  = "recovery-artifacts"
  storage_account_name  = azurerm_storage_account.recovery.name
  container_access_type = "private"
}

resource "azurerm_service_plan" "standby" {
  count               = var.standby_compute || var.profile == "resilient" ? 1 : 0
  name                = "${var.name_prefix}-asp-dr"
  location            = var.location
  resource_group_name = azurerm_resource_group.recovery.name
  os_type             = "Linux"
  sku_name            = "B1"
  tags                = var.tags
}

resource "azurerm_linux_web_app" "standby" {
  count               = var.standby_compute || var.profile == "resilient" ? 1 : 0
  name                = "${var.name_prefix}-app-dr"
  location            = var.location
  resource_group_name = azurerm_resource_group.recovery.name
  service_plan_id     = azurerm_service_plan.standby[0].id
  https_only          = true
  tags                = merge(var.tags, { state = "standby" })

  site_config {
    minimum_tls_version = "1.2"
  }

  identity {
    type = "SystemAssigned"
  }
}

resource "random_string" "dr_sa" {
  length  = 6
  lower   = true
  upper   = false
  numeric = true
  special = false
}
