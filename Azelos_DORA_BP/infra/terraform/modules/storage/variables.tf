variable "name_prefix" {
  type = string
}

variable "location" {
  type = string
}

variable "resource_group_name" {
  type = string
}

variable "account_tier" {
  type    = string
  default = "Standard"
}

variable "account_replication_type" {
  type    = string
  default = "LRS"
}

variable "evidence_container_name" {
  type    = string
  default = "evidence"
}

variable "exports_container_name" {
  type    = string
  default = "exports"
}

variable "log_analytics_workspace_id" {
  type    = string
  default = null
}

variable "enable_diagnostic_settings" {
  type        = bool
  description = "Create monitor diagnostic settings (use a static bool; do not derive count from workspace id)."
  default     = true
}

variable "tags" {
  type    = map(string)
  default = {}
}
