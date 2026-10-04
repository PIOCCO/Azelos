variable "name_prefix" {
  type = string
}

variable "location" {
  type = string
}

variable "resource_group_name" {
  type = string
}

variable "sku" {
  type    = string
  default = "Basic"
}

variable "admin_enabled" {
  type        = bool
  default     = false
  description = "Dev only: enables username/password for docker push when Entra/ACR Tasks are blocked."
}

variable "tags" {
  type    = map(string)
  default = {}
}
