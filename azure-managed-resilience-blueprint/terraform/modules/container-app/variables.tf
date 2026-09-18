variable "environment_name" { type = string }
variable "api_app_name" { type = string }
variable "dashboard_app_name" { type = string }
variable "resource_group_name" { type = string }
variable "location" { type = string }
variable "log_analytics_workspace_id" { type = string }
variable "api_image" { type = string }
variable "dashboard_image" { type = string }

variable "database_url" {
  type      = string
  sensitive = true
}

variable "jwt_secret" {
  type      = string
  sensitive = true
}

variable "azure_mock" {
  type    = string
  default = "true"
}
