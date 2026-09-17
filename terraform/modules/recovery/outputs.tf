output "recovery_resource_group_name" {
  value = azurerm_resource_group.recovery.name
}

output "recovery_storage_account_name" {
  value = azurerm_storage_account.recovery.name
}

output "standby_app_url" {
  value = length(azurerm_linux_web_app.standby) > 0 ? "https://${azurerm_linux_web_app.standby[0].default_hostname}" : ""
}

output "standby_enabled" {
  value = length(azurerm_linux_web_app.standby) > 0
}
