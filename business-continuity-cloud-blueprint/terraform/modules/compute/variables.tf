variable "name_prefix" { type = string }
variable "location" { type = string }
variable "tags" { type = map(string) }
variable "profile" { type = string }

variable "app_subnet_id" {
  type    = string
  default = null
}

variable "health_check_path" {
  type    = string
  default = "/health"
}
