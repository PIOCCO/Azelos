variable "job_name" { type = string }
variable "location" { type = string }
variable "resource_group_name" { type = string }
variable "container_app_environment_id" { type = string }
variable "api_image" { type = string }
variable "cron_expression" { type = string }
variable "sync_tenant_ids" { type = string }
variable "environment" {
  type    = string
  default = "development"
}

variable "demo_mode" {
  type    = string
  default = "true"
}

variable "database_url" {
  type      = string
  sensitive = true
}
