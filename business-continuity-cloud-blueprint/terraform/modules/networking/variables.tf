variable "name_prefix" { type = string }
variable "location" { type = string }
variable "tags" { type = map(string) }

variable "address_space" {
  type    = list(string)
  default = ["10.10.0.0/16"]
}

variable "app_subnet_prefix" {
  type    = string
  default = "10.10.1.0/24"
}

variable "data_subnet_prefix" {
  type    = string
  default = "10.10.2.0/24"
}

variable "enable_private_endpoints" {
  type    = bool
  default = true
}
