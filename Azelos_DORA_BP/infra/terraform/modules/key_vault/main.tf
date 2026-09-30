data "azurerm_client_config" "current" {}

resource "random_string" "kv_suffix" {
  length  = 6
  lower   = true
  upper   = false
  numeric = true
  special = false
}

resource "azurerm_key_vault" "this" {
  name                       = substr(replace("${var.name_prefix}kv${random_string.kv_suffix.result}", "-", ""), 0, 24)
  location                   = var.location
  resource_group_name        = var.resource_group_name
  tenant_id                  = var.tenant_id
  sku_name                   = "standard"
  soft_delete_retention_days = var.soft_delete_retention_days
  purge_protection_enabled   = var.purge_protection_enabled
  rbac_authorization_enabled = true

  public_network_access_enabled = true

  network_acls {
    bypass                     = "AzureServices"
    default_action             = length(var.allowed_ip_ranges) > 0 ? "Deny" : "Allow"
    ip_rules                   = var.allowed_ip_ranges
    virtual_network_subnet_ids = []
  }

  tags = var.tags
}

resource "azurerm_role_assignment" "deployer_secrets_officer" {
  scope                = azurerm_key_vault.this.id
  role_definition_name = "Key Vault Secrets Officer"
  principal_id         = data.azurerm_client_config.current.object_id
}
