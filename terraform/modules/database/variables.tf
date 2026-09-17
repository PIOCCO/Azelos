variable "name_prefix" { type = string }
variable "location" { type = string }
variable "tags" { type = map(string) }
variable "profile" { type = string }

variable "admin_login" {
  type    = string
  default = "bcbpadmin"
}

variable "data_subnet_id" {
  type    = string
  default = null
}

variable "key_vault_id" {
  type = string
}

variable "backup_retention_days" {
  type    = number
  default = 30
}
