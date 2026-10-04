variable "name_prefix" {
  type = string
}

variable "location" {
  type = string
}

variable "resource_group_name" {
  type = string
}

variable "container_apps_subnet_id" {
  type        = string
  default     = null
  description = "Infrastructure subnet for VNet-integrated environments; null for platform-managed network."
}

variable "use_custom_vnet" {
  type        = bool
  default     = true
  description = "When false, Container Apps uses the default managed network (no custom VNet integration)."
}

variable "log_analytics_workspace_id" {
  type = string
}

variable "acr_id" {
  type = string
}

variable "acr_login_server" {
  type = string
}

variable "acr_registry_name" {
  type        = string
  default     = null
  description = "ACR resource name; admin username equals this when Entra admin_username is unset."
}

variable "container_image" {
  type        = string
  description = "Full image reference, e.g. myacr.azurecr.io/dora-bp-app:1.0.0"
}

variable "use_acr_registry" {
  type        = bool
  default     = true
  description = "When false, image is public (e.g. MCR) — skip ACR registry auth (needed if Entra blocks ACR tokens)."
}

variable "acr_pull_auth" {
  type        = string
  default     = "managed_identity"
  description = "How Container Apps pulls from ACR: managed_identity, admin (username/password), or none (with use_acr_registry false)."
  validation {
    condition     = contains(["managed_identity", "admin", "none"], var.acr_pull_auth)
    error_message = "acr_pull_auth must be managed_identity, admin, or none."
  }
}

variable "acr_admin_username" {
  type        = string
  default     = null
  description = "ACR admin user when acr_pull_auth = admin."
}

variable "acr_admin_password" {
  type        = string
  default     = null
  sensitive   = true
  description = "ACR admin password when acr_pull_auth = admin."
}

variable "key_vault_id" {
  type = string
}

variable "secret_ids" {
  type = object({
    database_url   = string
    jwt_secret_key = string
  })
  description = "Key Vault secret resource IDs for Container Apps (VNet / non-express environments only)."
}

variable "inline_secrets" {
  type = object({
    database_url   = string
    jwt_secret_key = string
  })
  default     = null
  sensitive   = true
  description = "Plain secret values for express (managed-network) environments — Key Vault refs not supported."
}

variable "app_environment_variables" {
  type        = map(string)
  description = "Non-secret environment variables."
  default     = {}
}

variable "min_replicas" {
  type    = number
  default = 0
}

variable "max_replicas" {
  type    = number
  default = 3
}

variable "cpu" {
  type    = number
  default = 0.5
}

variable "memory" {
  type    = string
  default = "1Gi"
}

variable "tags" {
  type    = map(string)
  default = {}
}
