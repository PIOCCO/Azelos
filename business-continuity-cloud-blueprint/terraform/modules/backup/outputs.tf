output "recovery_vault_id" {
  value = azurerm_recovery_services_vault.main.id
}

output "recovery_vault_name" {
  value = azurerm_recovery_services_vault.main.name
}

output "vm_backup_policy_id" {
  value = azurerm_backup_policy_vm.daily.id
}

output "resource_group_name" {
  value = azurerm_resource_group.backup.name
}
