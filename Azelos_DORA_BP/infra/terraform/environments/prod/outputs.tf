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
