output "dashboard_url" {
  value = "https://${module.apps.dashboard_fqdn}"
}

output "api_url" {
  value = "https://${module.apps.api_fqdn}"
}

output "acr_login_server" {
  value = module.acr.login_server
}

output "api_managed_identity_principal_id" {
  value = module.apps.api_principal_id
}
