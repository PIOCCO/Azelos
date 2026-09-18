variable "name_prefix" {
  type    = string
  default = "bcbp-dev"
}

variable "primary_region" {
  type    = string
  default = "eastus"
}

variable "secondary_region" {
  type    = string
  default = "westus2"
}

variable "profile" {
  type        = string
  description = "minimal | standard | resilient"
  default     = "standard"

  validation {
    condition     = contains(["minimal", "standard", "resilient"], var.profile)
    error_message = "profile must be minimal, standard, or resilient"
  }
}

variable "alert_email" {
  type    = string
  default = "ops@example.com"
}

variable "backup_retention_days" {
  type    = number
  default = 30
}

variable "standby_compute" {
  type    = bool
  default = false
}

variable "enable_immutability" {
  type    = bool
  default = true
}

variable "health_check_path" {
  type    = string
  default = "/health"
}

variable "tags" {
  type = map(string)
  default = {
    project    = "bcbp"
    managed_by = "terraform"
    env        = "dev"
  }
}
