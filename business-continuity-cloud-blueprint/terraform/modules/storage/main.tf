resource "azurerm_resource_group" "storage" {
  name     = "${var.name_prefix}-rg-storage"
  location = var.location
  tags     = var.tags
}

locals {
  replication = var.profile == "minimal" ? "LRS" : "GRS"
}

resource "random_string" "sa_suffix" {
  length  = 6
  lower   = true
  upper   = false
  numeric = true
  special = false
}

resource "azurerm_storage_account" "app" {
  name                     = substr(replace("${var.name_prefix}app${random_string.sa_suffix.result}", "-", ""), 0, 24)
  resource_group_name      = azurerm_resource_group.storage.name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = local.replication
  min_tls_version          = "TLS1_2"
  tags                     = var.tags

  blob_properties {
    delete_retention_policy {
      days = 30
    }
    container_delete_retention_policy {
      days = 30
    }
  }

  dynamic "immutability_policy" {
    for_each = var.enable_immutability && var.profile != "minimal" ? [1] : []
    content {
      allow_protected_append_writes = true
      state                         = "Unlocked"
      period_since_creation_in_days = 7
    }
  }
}

resource "azurerm_storage_container" "app_data" {
  name                  = "appdata"
  storage_account_name  = azurerm_storage_account.app.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "backups" {
  name                  = "backups"
  storage_account_name  = azurerm_storage_account.app.name
  container_access_type = "private"
}
