variable "name_prefix" {
  type = string
}

variable "location" {
  type = string
}

variable "resource_group_name" {
  type = string
}

variable "retention_in_days" {
  type        = number
  description = "Log Analytics retention."
  default     = 30
}

variable "tags" {
  type    = map(string)
  default = {}
}
