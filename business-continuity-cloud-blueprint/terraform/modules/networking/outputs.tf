output "resource_group_name" {
  value = azurerm_resource_group.network.name
}

output "vnet_id" {
  value = azurerm_virtual_network.main.id
}

output "app_subnet_id" {
  value = azurerm_subnet.app.id
}

output "data_subnet_id" {
  value = azurerm_subnet.data.id
}

output "location" {
  value = var.location
}
