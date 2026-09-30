output "account_name" {
  value = azurerm_storage_account.this.name
}

output "account_id" {
  value = azurerm_storage_account.this.id
}

output "evidence_container_name" {
  value = azurerm_storage_container.evidence.name
}

output "primary_blob_endpoint" {
  value = azurerm_storage_account.this.primary_blob_endpoint
}
