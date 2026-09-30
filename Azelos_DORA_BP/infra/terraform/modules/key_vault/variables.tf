variable "name_prefix" {
  type = string
}

variable "location" {
  type = string
}

variable "resource_group_name" {
  type = string
}

variable "tenant_id" {
  type = string
}

variable "purge_protection_enabled" {
  type    = bool
  default = false
}

variable "soft_delete_retention_days" {
  type    = number
  default = 7
}

variable "allowed_ip_ranges" {
  type        = list(string)
  description = "Optional operator IPs for Key Vault access during bootstrap (CIDR)."
  default     = []
}

variable "tags" {
  type    = map(string)
  default = {}
}
