variable "name_prefix" { type = string }
variable "location" { type = string }
variable "tags" { type = map(string) }

variable "action_group_id" { type = string }
variable "storage_account_id" { type = string }

variable "enable_immutability" {
  type    = bool
  default = true
}

variable "backup_retention_days" {
  type    = number
  default = 30
}
