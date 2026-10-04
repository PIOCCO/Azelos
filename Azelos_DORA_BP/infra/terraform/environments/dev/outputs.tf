output "application_url" {
  value = module.platform.application_url
}

output "postgresql_fqdn" {
  value = module.platform.postgresql_fqdn
}

output "key_vault_uri" {
  value = module.platform.key_vault_uri
}

output "container_registry_login_server" {
  value = module.platform.container_registry_login_server
}

output "container_registry_name" {
  value = module.platform.container_registry_name
}

output "acr_pull_auth" {
  value = module.platform.acr_pull_auth
}

output "resource_group_name" {
  value = module.platform.resource_group_name
}

output "storage_account_name" {
  value = module.platform.storage_account_name
}
