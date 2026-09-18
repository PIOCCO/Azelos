terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.117.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6.0"
    }
  }
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy    = false
      recover_soft_deleted_key_vaults = true
    }
    resource_group {
      prevent_deletion_if_contains_resources = true
    }
  }
}

module "networking" {
  source      = "../../modules/networking"
  name_prefix = var.name_prefix
  location    = var.primary_region
  tags        = var.tags
}

module "monitoring" {
  source      = "../../modules/monitoring"
  name_prefix = var.name_prefix
  location    = var.primary_region
  tags        = var.tags
  alert_email = var.alert_email
}

module "storage" {
  source              = "../../modules/storage"
  name_prefix         = var.name_prefix
  location            = var.primary_region
  tags                = var.tags
  profile             = var.profile
  enable_immutability = var.enable_immutability
}

module "database" {
  source                = "../../modules/database"
  name_prefix           = var.name_prefix
  location              = var.primary_region
  tags                  = var.tags
  profile               = var.profile
  key_vault_id          = module.monitoring.key_vault_id
  backup_retention_days = var.backup_retention_days
}

module "compute" {
  source            = "../../modules/compute"
  name_prefix       = var.name_prefix
  location          = var.primary_region
  tags              = var.tags
  profile           = var.profile
  app_subnet_id     = module.networking.app_subnet_id
  health_check_path = var.health_check_path
}

module "backup" {
  source                = "../../modules/backup"
  name_prefix           = var.name_prefix
  location              = var.primary_region
  tags                  = var.tags
  action_group_id       = module.monitoring.action_group_id
  storage_account_id    = module.storage.storage_account_id
  backup_retention_days = var.backup_retention_days
  enable_immutability   = var.enable_immutability
}

module "recovery" {
  source          = "../../modules/recovery"
  name_prefix     = var.name_prefix
  location        = var.secondary_region
  tags            = merge(var.tags, { env = "dr" })
  profile         = var.profile
  standby_compute = var.standby_compute
}
