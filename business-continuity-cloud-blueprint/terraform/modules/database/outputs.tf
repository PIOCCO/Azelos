output "server_id" {
  value = azurerm_postgresql_flexible_server.main.id
}

output "server_fqdn" {
  value = azurerm_postgresql_flexible_server.main.fqdn
}

output "database_name" {
  value = azurerm_postgresql_flexible_server_database.app.name
}

output "resource_group_name" {
  value = azurerm_resource_group.database.name
}

output "geo_redundant_backup_enabled" {
  value = azurerm_postgresql_flexible_server.main.geo_redundant_backup_enabled
}
