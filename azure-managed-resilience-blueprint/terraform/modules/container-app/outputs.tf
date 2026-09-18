output "container_app_environment_id" {
  value = azurerm_container_app_environment.env.id
}

output "api_fqdn" { value = azurerm_container_app.api.ingress[0].fqdn }
output "dashboard_fqdn" { value = azurerm_container_app.dashboard.ingress[0].fqdn }
output "api_principal_id" { value = azurerm_container_app.api.identity[0].principal_id }
