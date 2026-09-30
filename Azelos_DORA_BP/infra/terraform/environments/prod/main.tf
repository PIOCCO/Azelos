module "platform" {
  source = "../../modules/platform"

  project_name = var.project_name
  environment  = "prod"
  location     = var.location
  owner        = var.owner
  tenant_id    = data.azurerm_client_config.current.tenant_id

  postgresql_sku_name                     = "GP_Standard_D4s_v3"
  postgresql_storage_mb                   = 131072
  postgresql_backup_retention_days        = 35
  postgresql_geo_redundant_backup_enabled = true
  log_analytics_retention_days            = 90
  acr_sku                                 = "Standard"
  storage_replication_type                = "GRS"
  key_vault_purge_protection_enabled      = true
  key_vault_allowed_ip_ranges             = var.key_vault_allowed_ip_ranges

  container_image        = var.container_image
  container_min_replicas = 2
  container_max_replicas = 6
  cors_origins           = var.cors_origins
}
