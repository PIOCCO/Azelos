output "app_fqdn" {
  value = azurerm_container_app.app.ingress[0].fqdn
}

output "app_url" {
  value = "https://${azurerm_container_app.app.ingress[0].fqdn}"
}

output "managed_identity_principal_id" {
  value = azurerm_user_assigned_identity.app.principal_id
}

output "managed_identity_id" {
  value = azurerm_user_assigned_identity.app.id
}
