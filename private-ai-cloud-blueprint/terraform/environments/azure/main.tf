terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = { source = "hashicorp/azurerm", version = "~> 3.117.0" }
  }
}

provider "azurerm" { features {} }

variable "name_prefix" { type = string }
variable "location" {
  type    = string
  default = "eastus"
}

resource "azurerm_resource_group" "paic" {
  name     = "${var.name_prefix}-rg"
  location = var.location
}

output "resource_group" {
  value = azurerm_resource_group.paic.name
}
