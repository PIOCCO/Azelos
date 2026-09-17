resource "azurerm_resource_group" "database" {
  name     = "${var.name_prefix}-rg-database"
  location = var.location
  tags     = var.tags
}

resource "random_password" "db_admin" {
  length  = 24
  special = true
}

resource "azurerm_postgresql_flexible_server" "main" {
  name                         = "${var.name_prefix}-psql"
  resource_group_name          = azurerm_resource_group.database.name
  location                     = var.location
  version                      = "16"
  administrator_login          = var.admin_login
  administrator_password       = random_password.db_admin.result
  storage_mb                   = var.profile == "minimal" ? 32768 : 65536
  sku_name                     = var.profile == "minimal" ? "B_Standard_B1ms" : "GP_Standard_D2s_v3"
  backup_retention_days        = var.backup_retention_days
  geo_redundant_backup_enabled = var.profile == "resilient"
  zone                         = var.profile != "minimal" ? "1" : null
  tags                         = var.tags

  authentication {
    active_directory_auth_enabled = false
    password_auth_enabled         = true
  }
}

resource "azurerm_postgresql_flexible_server_database" "app" {
  name      = "appdb"
  server_id = azurerm_postgresql_flexible_server.main.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

resource "azurerm_key_vault_secret" "db_password" {
  name         = "${var.name_prefix}-psql-admin-password"
  value        = random_password.db_admin.result
  key_vault_id = var.key_vault_id
  content_type = "text/plain"
  tags         = var.tags
}

resource "azurerm_postgresql_flexible_server_firewall_rule" "azure_services" {
  name             = "AllowAzureServices"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}
