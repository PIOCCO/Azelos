variable "name_prefix" { type = string }
variable "location" { type = string }
variable "tags" { type = map(string) }

variable "alert_email" { type = string }

variable "app_insights_connection_string" {
  type    = string
  default = null
}
