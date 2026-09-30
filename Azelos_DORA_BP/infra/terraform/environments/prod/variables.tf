variable "project_name" {
  type    = string
  default = "dora-bp"
}

variable "location" {
  type    = string
  default = "westeurope"
}

variable "owner" {
  type    = string
  default = "platform-team"
}

variable "container_image" {
  type = string
}

variable "cors_origins" {
  type = string
}

variable "key_vault_allowed_ip_ranges" {
  type    = list(string)
  default = []
}
