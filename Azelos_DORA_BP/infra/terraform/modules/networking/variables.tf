variable "name_prefix" {
  type = string
}

variable "location" {
  type = string
}

variable "resource_group_name" {
  type = string
}

variable "vnet_address_space" {
  type        = list(string)
  description = "VNet CIDR blocks."
  default     = ["10.40.0.0/16"]
}

variable "tags" {
  type    = map(string)
  default = {}
}
