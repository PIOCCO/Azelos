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
  type = string
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

variable "container_image" {
  type        = string
  description = "Full image reference, e.g. myacr.azurecr.io/dora-bp-app:1.0.0"
}

variable "use_acr_registry" {
  type        = bool
  default     = true
  description = "When false, image is public (e.g. MCR) — skip ACR registry auth (needed if Entra blocks ACR tokens)."
}

variable "key_vault_id" {
  type = string
}

variable "secret_ids" {
  type = object({
    database_url   = string
    jwt_secret_key = string
  })
  description = "Key Vault secret resource IDs for Container Apps."
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
