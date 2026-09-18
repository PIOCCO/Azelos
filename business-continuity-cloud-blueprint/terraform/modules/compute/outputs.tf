output "app_name" {
  value = azurerm_linux_web_app.main.name
}

output "app_url" {
  value = "https://${azurerm_linux_web_app.main.default_hostname}"
}

output "app_id" {
  value = azurerm_linux_web_app.main.id
}

output "principal_id" {
  value = azurerm_linux_web_app.main.identity[0].principal_id
}

output "resource_group_name" {
  value = azurerm_resource_group.compute.name
}
