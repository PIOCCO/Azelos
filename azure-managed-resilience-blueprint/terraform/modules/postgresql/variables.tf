variable "name" { type = string }
variable "resource_group_name" { type = string }
variable "location" { type = string }
variable "admin_login" { type = string }

variable "admin_password" {
  type      = string
  sensitive = true
}

variable "database_name" {
  type    = string
  default = "amrf"
}

variable "sku_name" {
  type    = string
  default = "B_Standard_B1ms"
}
