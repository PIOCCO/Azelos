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

variable "vm_size" {
  type    = string
  default = "Standard_B2s"
}

resource "azurerm_resource_group" "host" {
  name     = "${var.name_prefix}-rg"
  location = var.location
}

resource "azurerm_linux_virtual_machine" "host" {
  name                = "${var.name_prefix}-vm"
  resource_group_name = azurerm_resource_group.host.name
  location            = azurerm_resource_group.host.location
  size                = var.vm_size
  admin_username      = "whbpadmin"
  disable_password_authentication = true

  network_interface_ids = [azurerm_network_interface.host.id]

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "StandardSSD_LRS"
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts-gen2"
    version   = "latest"
  }

  admin_ssh_key {
    username   = "whbpadmin"
    public_key = file(var.admin_ssh_public_key_path)
  }
}

variable "admin_ssh_public_key_path" {
  type = string
}

resource "azurerm_virtual_network" "host" {
  name                = "${var.name_prefix}-vnet"
  address_space       = ["10.30.0.0/16"]
  location            = azurerm_resource_group.host.location
  resource_group_name = azurerm_resource_group.host.name
}

resource "azurerm_subnet" "host" {
  name                 = "snet-host"
  resource_group_name  = azurerm_resource_group.host.name
  virtual_network_name = azurerm_virtual_network.host.name
  address_prefixes     = ["10.30.1.0/24"]
}

resource "azurerm_public_ip" "host" {
  name                = "${var.name_prefix}-pip"
  location            = azurerm_resource_group.host.location
  resource_group_name = azurerm_resource_group.host.name
  allocation_method   = "Static"
  sku                 = "Standard"
}

resource "azurerm_network_interface" "host" {
  name                = "${var.name_prefix}-nic"
  location            = azurerm_resource_group.host.location
  resource_group_name = azurerm_resource_group.host.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.host.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.host.id
  }
}

output "public_ip" {
  value = azurerm_public_ip.host.ip_address
}
