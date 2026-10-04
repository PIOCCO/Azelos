# One-time bootstrap for remote Terraform state (local backend only).
resource "azurerm_resource_group" "tfstate" {
  name     = "${var.project_name}-tfstate-rg"
  location = var.location
  tags = {
    project    = var.project_name
    managed_by = "terraform-bootstrap"
    purpose    = "terraform-state"
  }
}

resource "random_string" "suffix" {
  length  = 6
  lower   = true
  upper   = false
  numeric = true
  special = false
}

resource "azurerm_storage_account" "tfstate" {
  # Storage account names: lowercase letters and numbers only (3–24 chars).
  name                     = lower(substr(replace("${var.project_name}tf${random_string.suffix.result}", "-", ""), 0, 24))
  resource_group_name      = azurerm_resource_group.tfstate.name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = var.storage_replication_type
  min_tls_version          = "TLS1_2"

  blob_properties {
    versioning_enabled = true
  }

  tags = azurerm_resource_group.tfstate.tags
}

resource "azurerm_storage_container" "tfstate" {
  name                  = "tfstate"
  storage_account_id    = azurerm_storage_account.tfstate.id
  container_access_type = "private"
}
