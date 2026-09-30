output "vnet_id" {
  value = azurerm_virtual_network.this.id
}

output "container_apps_subnet_id" {
  value = azurerm_subnet.container_apps.id
}

output "postgresql_subnet_id" {
  value = azurerm_subnet.postgresql.id
}

output "private_endpoints_subnet_id" {
  value = azurerm_subnet.private_endpoints.id
}

output "postgresql_private_dns_zone_id" {
  value = azurerm_private_dns_zone.postgresql.id
}
