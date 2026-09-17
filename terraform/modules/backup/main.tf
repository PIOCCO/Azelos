resource "azurerm_resource_group" "backup" {
  name     = "${var.name_prefix}-rg-backup"
  location = var.location
  tags     = var.tags
}

resource "azurerm_recovery_services_vault" "main" {
  name                = "${var.name_prefix}-rsv"
  location            = var.location
  resource_group_name = azurerm_resource_group.backup.name
  sku                 = "Standard"
  soft_delete_enabled = true
  tags                = var.tags

  identity {
    type = "SystemAssigned"
  }
}

resource "azurerm_backup_policy_vm" "daily" {
  name                = "${var.name_prefix}-vm-policy"
  resource_group_name = azurerm_resource_group.backup.name
  recovery_vault_name = azurerm_recovery_services_vault.main.name

  backup {
    frequency = "Daily"
    time      = "03:00"
  }

  retention_daily {
    count = var.backup_retention_days
  }

  instant_restore_retention_days = 2
}

resource "azurerm_monitor_metric_alert" "backup_failed" {
  name                = "${var.name_prefix}-alert-backup-failure"
  resource_group_name = azurerm_resource_group.backup.name
  scopes              = [azurerm_recovery_services_vault.main.id]
  description         = "Backup job failure detected. Runbook: recovery/runbooks/application-failure.md"
  severity            = 1
  frequency           = "PT15M"
  window_size         = "PT1H"
  tags                = var.tags

  criteria {
    metric_namespace = "Microsoft.RecoveryServices/vaults"
    metric_name      = "BackupHealthEvent"
    aggregation      = "Count"
    operator         = "GreaterThan"
    threshold        = 0
  }

  action {
    action_group_id = var.action_group_id
  }
}

resource "azurerm_role_assignment" "vault_storage" {
  scope                = var.storage_account_id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_recovery_services_vault.main.identity[0].principal_id
}
