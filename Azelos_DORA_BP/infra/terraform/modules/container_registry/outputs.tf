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
  value     = var.admin_enabled ? azurerm_container_registry.this.admin_username : null
  sensitive = false
}

output "admin_password" {
  value     = var.admin_enabled ? azurerm_container_registry.this.admin_password : null
  sensitive = true
}
