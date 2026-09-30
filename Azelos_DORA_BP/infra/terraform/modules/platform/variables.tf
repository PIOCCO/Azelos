variable "project_name" {
  type        = string
  description = "Short project slug used in naming."
  default     = "dora-bp"
}

variable "environment" {
  type        = string
  description = "Deployment environment."
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod."
  }
}

variable "location" {
  type        = string
  description = "Azure region."
  default     = "westeurope"
}

variable "owner" {
  type        = string
  description = "Tag: technical owner."
  default     = "platform-team"
}

variable "cost_center" {
  type    = string
  default = ""
}

variable "postgresql_sku_name" {
  type = string
}

variable "postgresql_storage_mb" {
  type    = number
  default = 32768
}

variable "postgresql_backup_retention_days" {
  type = number
}

variable "postgresql_geo_redundant_backup_enabled" {
  type = bool
}

variable "acr_sku" {
  type    = string
  default = "Basic"
}

variable "log_analytics_retention_days" {
  type = number
}

variable "key_vault_purge_protection_enabled" {
  type    = bool
  default = false
}

variable "key_vault_allowed_ip_ranges" {
  type    = list(string)
  default = []
}

variable "container_image" {
  type        = string
  description = "Container image in ACR (build/push separately from Dockerfile.app)."
}

variable "container_min_replicas" {
  type    = number
  default = 0
}

variable "container_max_replicas" {
  type    = number
  default = 2
}

variable "cors_origins" {
  type        = string
  description = "CORS_ORIGINS for FastAPI."
  default     = "*"
}

variable "storage_replication_type" {
  type    = string
  default = "LRS"
}

variable "postgresql_administrator_login" {
  type    = string
  default = "doraadmin"
}

variable "tenant_id" {
  type        = string
  description = "Azure AD tenant ID for Key Vault."
}
