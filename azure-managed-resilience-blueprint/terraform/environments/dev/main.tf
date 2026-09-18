terraform {
  required_providers {
    azurerm = { source = "hashicorp/azurerm", version = "~> 3.117" }
    random  = { source = "hashicorp/random", version = "~> 3.6" }
  }
}

provider "azurerm" {
  features {
    key_vault { purge_soft_delete_on_destroy = true }
  }
  subscription_id = var.subscription_id
}

module "rg" {
  source   = "../../modules/resource-group"
  name     = var.resource_group_name
  location = var.location
  tags     = var.tags
}

resource "random_password" "pg" {
  length  = 24
  special = true
}

resource "random_password" "jwt" {
  length  = 32
  special = false
}

module "insights" {
  source              = "../../modules/application-insights"
  name                = "${var.name_prefix}-appi"
  law_name            = "${var.name_prefix}-law"
  resource_group_name = module.rg.name
  location            = module.rg.location
}

module "acr" {
  source              = "../../modules/container-registry"
  name                = replace("${var.name_prefix}acr", "-", "")
  resource_group_name = module.rg.name
  location            = module.rg.location
}

module "storage" {
  source              = "../../modules/storage"
  name                = replace("${var.name_prefix}st", "-", "")
  resource_group_name = module.rg.name
  location            = module.rg.location
}

module "kv" {
  source              = "../../modules/key-vault"
  name                = "${var.name_prefix}-kv"
  resource_group_name = module.rg.name
  location            = module.rg.location
}

module "postgresql" {
  source              = "../../modules/postgresql"
  name                = "${var.name_prefix}-pg"
  resource_group_name = module.rg.name
  location            = module.rg.location
  admin_login         = var.postgresql_admin_login
  admin_password      = random_password.pg.result
  sku_name            = var.postgresql_sku
}

module "monitoring" {
  source              = "../../modules/monitoring"
  resource_group_name = module.rg.name
  action_group_name   = "${var.name_prefix}-ag"
  budget_name         = "${var.name_prefix}-budget"
  subscription_id     = var.subscription_id
  budget_amount       = var.budget_usd
  budget_start_date   = var.budget_start_date
  alert_email         = var.alert_email
}

locals {
  db_url = "postgresql+psycopg://${var.postgresql_admin_login}:${random_password.pg.result}@${module.postgresql.fqdn}:5432/${module.postgresql.database_name}?sslmode=require"
}

module "apps" {
  source                     = "../../modules/container-app"
  environment_name           = "${var.name_prefix}-cae"
  api_app_name               = "${var.name_prefix}-api"
  dashboard_app_name         = "${var.name_prefix}-ui"
  resource_group_name        = module.rg.name
  location                   = module.rg.location
  log_analytics_workspace_id = module.insights.log_analytics_workspace_id
  api_image                  = "${module.acr.login_server}/amrf-api:latest"
  dashboard_image            = "${module.acr.login_server}/amrf-dashboard:latest"
  database_url               = local.db_url
  jwt_secret                 = random_password.jwt.result
  azure_mock                 = var.azure_mock
}
