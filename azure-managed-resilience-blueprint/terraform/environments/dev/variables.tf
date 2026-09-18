variable "subscription_id" { type = string }
variable "location" {
  type    = string
  default = "westeurope"
}
variable "name_prefix" {
  type    = string
  default = "amrf-dev"
}
variable "resource_group_name" {
  type    = string
  default = "rg-amrf-dev"
}
variable "postgresql_admin_login" {
  type    = string
  default = "amrfadmin"
}
variable "postgresql_sku" {
  type    = string
  default = "B_Standard_B1ms"
}
variable "budget_usd" {
  type    = number
  default = 200
}
variable "budget_start_date" { type = string }
variable "alert_email" { type = string }
variable "azure_mock" {
  type    = string
  default = "true"
}
variable "sync_cron" {
  type    = string
  default = "0 * * * *"
}
variable "sync_tenant_ids" {
  type    = string
  default = "tenant-demo"
}
variable "tags" {
  type = map(string)
  default = {
    Project     = "AtlasAzureResilience"
    Environment = "development"
    ManagedBy   = "terraform"
    Owner       = "platform-team"
    CostCenter  = "ops"
  }
}
