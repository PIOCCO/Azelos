variable "resource_group_name" { type = string }
variable "action_group_name" { type = string }
variable "budget_name" { type = string }
variable "subscription_id" { type = string }
variable "budget_start_date" { type = string }
variable "alert_email" { type = string }

variable "budget_amount" {
  type    = number
  default = 200
}
