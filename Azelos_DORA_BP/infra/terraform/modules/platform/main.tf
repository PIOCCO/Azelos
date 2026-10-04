module "resource_group" {
  source   = "../resource_group"
  name     = "${local.name_prefix}-rg"
  location = var.location
  tags     = local.tags
}

module "monitoring" {
  source              = "../monitoring"
  name_prefix         = local.name_prefix
  location            = var.location
  resource_group_name = module.resource_group.name
  retention_in_days   = var.log_analytics_retention_days
  tags                = local.tags
}

module "networking" {
  source              = "../networking"
  name_prefix         = local.name_prefix
  location            = var.location
  resource_group_name = module.resource_group.name
  tags                = local.tags
}

module "key_vault" {
  source                   = "../key_vault"
  name_prefix              = local.name_prefix
  location                 = var.location
  resource_group_name      = module.resource_group.name
  tenant_id                = var.tenant_id
  purge_protection_enabled = var.key_vault_purge_protection_enabled
  allowed_ip_ranges        = var.key_vault_allowed_ip_ranges
  tags                     = local.tags
}

module "container_registry" {
  source              = "../container_registry"
  name_prefix         = local.name_prefix
  location            = var.location
  resource_group_name = module.resource_group.name
  sku                 = var.acr_sku
  tags                = local.tags
}

module "storage" {
  source                     = "../storage"
  name_prefix                = local.name_prefix
  location                   = var.location
  resource_group_name        = module.resource_group.name
  account_replication_type   = var.storage_replication_type
  log_analytics_workspace_id = module.monitoring.log_analytics_workspace_id
  tags                       = local.tags
}

resource "random_password" "postgresql_admin" {
  length  = 24
  special = true
}

resource "random_password" "jwt_secret" {
  length  = 48
  special = false
}

resource "azurerm_key_vault_secret" "postgresql_admin_password" {
  name         = "postgresql-admin-password"
  value        = random_password.postgresql_admin.result
  key_vault_id = module.key_vault.id

  depends_on = [module.key_vault]
}

resource "azurerm_key_vault_secret" "jwt_secret_key" {
  name         = "jwt-secret-key"
  value        = random_password.jwt_secret.result
  key_vault_id = module.key_vault.id

  depends_on = [module.key_vault]
}

module "postgres" {
  source                        = "../postgres"
  name_prefix                   = local.name_prefix
  location                      = var.location
  resource_group_name           = module.resource_group.name
  administrator_login           = var.postgresql_administrator_login
  administrator_password        = random_password.postgresql_admin.result
  sku_name                      = var.postgresql_sku_name
  storage_mb                    = var.postgresql_storage_mb
  backup_retention_days         = var.postgresql_backup_retention_days
  geo_redundant_backup_enabled  = var.postgresql_geo_redundant_backup_enabled
  delegated_subnet_id           = module.networking.postgresql_subnet_id
  private_dns_zone_id           = module.networking.postgresql_private_dns_zone_id
  public_network_access_enabled = false
  log_analytics_workspace_id    = module.monitoring.log_analytics_workspace_id
  tags                          = local.tags
}

resource "azurerm_key_vault_secret" "database_url" {
  name         = "database-url"
  value        = "postgresql+psycopg://${var.postgresql_administrator_login}:${random_password.postgresql_admin.result}@${module.postgres.fqdn}:5432/${module.postgres.database_name}?sslmode=require"
  key_vault_id = module.key_vault.id

  depends_on = [module.postgres, module.key_vault]
}

module "compute" {
  source                     = "../compute"
  name_prefix                = local.name_prefix
  location                   = var.location
  resource_group_name        = module.resource_group.name
  container_apps_subnet_id   = module.networking.container_apps_subnet_id
  log_analytics_workspace_id = module.monitoring.log_analytics_workspace_id
  acr_id                     = module.container_registry.id
  acr_login_server           = module.container_registry.login_server
  container_image            = var.container_image
  use_acr_registry           = can(regex("\\.azurecr\\.io/", var.container_image))
  key_vault_id               = module.key_vault.id
  secret_ids = {
    database_url   = azurerm_key_vault_secret.database_url.id
    jwt_secret_key = azurerm_key_vault_secret.jwt_secret_key.id
  }
  app_environment_variables = {
    DB_SSL_MODE             = "require"
    SERVE_FRONTEND          = "1"
    STORAGE_PROVIDER        = "azure_blob"
    AZURE_STORAGE_ACCOUNT   = module.storage.account_name
    AZURE_STORAGE_CONTAINER = module.storage.evidence_container_name
    CORS_ORIGINS            = var.cors_origins
  }
  min_replicas = var.container_min_replicas
  max_replicas = var.container_max_replicas
  tags         = local.tags

  depends_on = [
    azurerm_key_vault_secret.database_url,
    azurerm_key_vault_secret.jwt_secret_key,
    module.postgres,
  ]
}

resource "azurerm_role_assignment" "app_storage_blob" {
  scope                = module.storage.account_id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = module.compute.managed_identity_principal_id
}
