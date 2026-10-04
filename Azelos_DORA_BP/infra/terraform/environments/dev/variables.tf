variable "project_name" {
  type    = string
  default = "dora-bp"
}

variable "location" {
  type    = string
  default = "westeurope"
}

variable "owner" {
  type    = string
  default = "platform-team"
}

variable "container_image" {
  type        = string
  description = "Image in ACR (build Dockerfile.app and push before first deploy)."
}

variable "cors_origins" {
  type    = string
  default = "*"
}

variable "key_vault_allowed_ip_ranges" {
  type        = list(string)
  description = "Operator public IPs for Key Vault during bootstrap (optional)."
  default     = []
}

variable "integrate_container_apps_with_vnet" {
  type        = bool
  description = "false = Container Apps default network + PostgreSQL public (recommended for dev when VNet CAE fails)."
  default     = false
}

variable "acr_admin_enabled" {
  type        = bool
  description = "Enable ACR admin user: local docker push + Container App pull without Entra ACR tokens (dev only)."
  default     = true
}
