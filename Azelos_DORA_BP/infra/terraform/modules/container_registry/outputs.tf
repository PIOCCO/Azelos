output "login_server" {
  value = azurerm_container_registry.this.login_server
}

output "id" {
  value = azurerm_container_registry.this.id
}

output "name" {
  value = azurerm_container_registry.this.name
}

output "admin_username" {
  value = var.admin_enabled ? coalesce(
    azurerm_container_registry.this.admin_username != null && trimspace(azurerm_container_registry.this.admin_username) != "" ?
    trimspace(azurerm_container_registry.this.admin_username) :
    null,
    azurerm_container_registry.this.name
  ) : null
  sensitive = false
}

output "admin_password" {
  value     = var.admin_enabled ? azurerm_container_registry.this.admin_password : null
  sensitive = true
}
