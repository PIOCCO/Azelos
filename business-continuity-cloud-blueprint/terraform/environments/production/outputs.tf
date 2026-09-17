output "primary_region" {
  value = var.primary_region
}

output "secondary_region" {
  value = var.secondary_region
}

output "profile" {
  value = var.profile
}

output "application_url" {
  value = module.compute.app_url
}

output "standby_application_url" {
  value = module.recovery.standby_app_url
}

output "postgresql_fqdn" {
  value = module.database.server_fqdn
}

output "storage_account_name" {
  value = module.storage.storage_account_name
}

output "recovery_vault_name" {
  value = module.backup.recovery_vault_name
}

output "key_vault_uri" {
  value = module.monitoring.key_vault_uri
}

output "recovery_storage_account_name" {
  value = module.recovery.recovery_storage_account_name
}

output "architecture_summary" {
  value = {
    dr_model                  = var.profile == "minimal" ? "backup-restore" : "active-passive"
    geo_redundant_storage     = var.profile != "minimal"
    postgres_geo_backup       = var.profile == "resilient"
    standby_secondary_compute = module.recovery.standby_enabled
  }
}
