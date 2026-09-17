variable "name_prefix" { type = string }
variable "location" { type = string }
variable "tags" { type = map(string) }
variable "profile" { type = string }

variable "enable_immutability" {
  type    = bool
  default = true
}
