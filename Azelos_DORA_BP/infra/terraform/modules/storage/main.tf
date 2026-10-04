resource "random_string" "sa_suffix" {
  length  = 6
  lower   = true
  upper   = false
  numeric = true
  special = false
}

resource "azurerm_storage_account" "this" {
  name                       = substr(replace("${var.name_prefix}st${random_string.sa_suffix.result}", "-", ""), 0, 24)
  resource_group_name        = var.resource_group_name
  location                   = var.location
  account_tier               = var.account_tier
  account_replication_type   = var.account_replication_type
  min_tls_version            = "TLS1_2"
  https_traffic_only_enabled = true

  blob_properties {
    delete_retention_policy {
      days = 7
    }
  }

  tags = var.tags
}

resource "azurerm_storage_container" "evidence" {
  name                  = var.evidence_container_name
  storage_account_id    = azurerm_storage_account.this.id
  container_access_type = "private"
}

resource "azurerm_storage_container" "exports" {
  name                  = var.exports_container_name
  storage_account_id    = azurerm_storage_account.this.id
  container_access_type = "private"
}

resource "azurerm_monitor_diagnostic_setting" "storage" {
  count = var.enable_diagnostic_settings ? 1 : 0

  name                       = "${var.name_prefix}-st-diag"
  target_resource_id         = "${azurerm_storage_account.this.id}/blobServices/default"
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_metric {
    category = "Transaction"
  }
}
