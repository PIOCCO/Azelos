variable "name_prefix" {
  type = string
}

variable "location" {
  type = string
}

variable "resource_group_name" {
  type = string
}

variable "administrator_login" {
  type        = string
  description = "PostgreSQL admin username."
}

variable "administrator_password" {
  type        = string
  sensitive   = true
  description = "PostgreSQL admin password (from Key Vault / random, not committed)."
}

variable "postgresql_version" {
  type    = string
  default = "16"
}

variable "sku_name" {
  type        = string
  description = "Flexible server SKU, e.g. B_Standard_B1ms or GP_Standard_D2s_v3."
}

variable "storage_mb" {
  type    = number
  default = 32768
}

variable "backup_retention_days" {
  type    = number
  default = 7
}

variable "geo_redundant_backup_enabled" {
  type    = bool
  default = false
}

variable "zone" {
  type        = string
  description = "Availability zone (optional)."
  default     = null
}

variable "database_name" {
  type    = string
  default = "dora_supplier_risk"
}

variable "delegated_subnet_id" {
  type        = string
  default     = null
  description = "Subnet ID for private VNet access; null when using public access."
}

variable "private_dns_zone_id" {
  type        = string
  default     = null
  description = "Private DNS zone for VNet-integrated server; null for public access."
}

variable "open_public_firewall" {
  type        = bool
  default     = false
  description = "Dev only: allow PostgreSQL connections from Azure (0.0.0.0–255.255.255.255). Never in prod."
}

variable "public_network_access_enabled" {
  type        = bool
  description = "Keep false in production; dev may enable with firewall rules outside this module."
  default     = false
}

variable "log_analytics_workspace_id" {
  type        = string
  description = "Log Analytics workspace for diagnostics."
  default     = null
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
