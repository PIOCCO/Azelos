output "api_fqdn" { value = azurerm_container_app.api.ingress[0].fqdn }
output "dashboard_fqdn" { value = azurerm_container_app.dashboard.ingress[0].fqdn }
output "api_principal_id" { value = azurerm_container_app.api.identity[0].principal_id }
