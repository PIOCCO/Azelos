resource "azurerm_resource_group" "compute" {
  name     = "${var.name_prefix}-rg-compute"
  location = var.location
  tags     = var.tags
}

resource "azurerm_service_plan" "main" {
  name                = "${var.name_prefix}-asp"
  location            = var.location
  resource_group_name = azurerm_resource_group.compute.name
  os_type             = "Linux"
  sku_name            = var.profile == "minimal" ? "B1" : "P1v3"
  tags                = var.tags
}

resource "azurerm_linux_web_app" "main" {
  name                = "${var.name_prefix}-app"
  location            = var.location
  resource_group_name = azurerm_resource_group.compute.name
  service_plan_id     = azurerm_service_plan.main.id
  https_only          = true
  tags                = var.tags

  site_config {
    minimum_tls_version = "1.2"
    health_check_path   = var.health_check_path

    application_stack {
      docker_image_name   = "mcr.microsoft.com/azuredocs/aci-helloworld:latest"
      docker_registry_url = "https://mcr.microsoft.com"
    }
  }

  identity {
    type = "SystemAssigned"
  }

  virtual_network_subnet_id = var.app_subnet_id

  app_settings = {
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE" = "false"
    "HEALTHCHECK_PATH"                    = var.health_check_path
  }
}
