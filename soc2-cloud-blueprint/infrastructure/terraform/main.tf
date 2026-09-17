# Optional Azure baseline for logging + Key Vault (SOC 2 CC7.x / CC6.x support)
# Deploy per client — see docs/architecture.md

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.117.0"
    }
  }
}

provider "azurerm" {
  features {}
}

variable "name_prefix" { type = string }
variable "location" {
  type    = string
  default = "eastus"
}

resource "azurerm_resource_group" "compliance" {
  name     = "${var.name_prefix}-rg-compliance"
  location = var.location
}

resource "azurerm_log_analytics_workspace" "soc2" {
  name                = "${var.name_prefix}-law"
  location            = azurerm_resource_group.compliance.location
  resource_group_name = azurerm_resource_group.compliance.name
  sku                 = "PerGB2018"
  retention_in_days   = 90
}

resource "azurerm_key_vault" "soc2" {
  name                       = substr(replace("${var.name_prefix}-kv", "-", ""), 0, 24)
  location                   = azurerm_resource_group.compliance.location
  resource_group_name        = azurerm_resource_group.compliance.name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  soft_delete_retention_days = 90
  purge_protection_enabled   = true
  enable_rbac_authorization  = true
}

data "azurerm_client_config" "current" {}

output "log_analytics_id" {
  value = azurerm_log_analytics_workspace.soc2.id
}

output "key_vault_id" {
  value = azurerm_key_vault.soc2.id
}
