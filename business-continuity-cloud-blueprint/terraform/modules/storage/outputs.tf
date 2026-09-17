output "storage_account_id" {
  value = azurerm_storage_account.app.id
}

output "storage_account_name" {
  value = azurerm_storage_account.app.name
}

output "primary_blob_endpoint" {
  value = azurerm_storage_account.app.primary_blob_endpoint
}

output "replication_type" {
  value = azurerm_storage_account.app.account_replication_type
}

output "resource_group_name" {
  value = azurerm_resource_group.storage.name
}
