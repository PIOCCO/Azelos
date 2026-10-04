module "platform" {
  source = "../../modules/platform"

  project_name = var.project_name
  environment  = "dev"
  location     = var.location
  owner        = var.owner
  tenant_id    = data.azurerm_client_config.current.tenant_id

  postgresql_sku_name                     = "B_Standard_B1ms"
  postgresql_storage_mb                   = 32768
  postgresql_backup_retention_days        = 7
  postgresql_geo_redundant_backup_enabled = false
  log_analytics_retention_days            = 30
  acr_sku                                 = "Basic"
  storage_replication_type                = "LRS"
  key_vault_purge_protection_enabled      = false
  key_vault_allowed_ip_ranges             = var.key_vault_allowed_ip_ranges

  container_image        = var.container_image
  container_min_replicas = 0
  container_max_replicas = 2
  cors_origins           = var.cors_origins

  # Spain Central / some subscriptions fail CAE + custom VNet with a vague 400; dev uses managed network + public PG.
  integrate_container_apps_with_vnet = var.integrate_container_apps_with_vnet
  acr_admin_enabled                  = var.acr_admin_enabled
  storage_provider                   = var.storage_provider
}
