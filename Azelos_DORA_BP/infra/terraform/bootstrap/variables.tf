variable "location" {
  type    = string
  default = "westeurope"
}

variable "project_name" {
  type    = string
  default = "dora-bp"
}

variable "storage_replication_type" {
  type        = string
  default     = "LRS"
  description = "Storage redundancy for tfstate. Use LRS in regions where GRS is unavailable (e.g. spaincentral)."
}
