output "resource_group_name" {
  value = module.resource_group.name
}

output "application_url" {
  value = module.compute.app_url
}

output "postgresql_fqdn" {
  value = module.postgres.fqdn
}

output "postgresql_database_name" {
  value = module.postgres.database_name
}

output "storage_account_name" {
  value = module.storage.account_name
}

output "evidence_container_name" {
  value = module.storage.evidence_container_name
}

output "key_vault_uri" {
  value = module.key_vault.vault_uri
}

output "container_registry_login_server" {
  value = module.container_registry.login_server
}

output "container_registry_name" {
  value = module.container_registry.name
}

output "acr_pull_auth" {
  value       = local.acr_pull_auth
  description = "How the Container App authenticates to ACR (admin avoids broken Entra ACR tokens)."
}

output "log_analytics_workspace_id" {
  value = module.monitoring.log_analytics_workspace_id
}

output "managed_identity_principal_id" {
  value = module.compute.managed_identity_principal_id
}

output "deployment_notes" {
  value = <<-EOT
    After apply: push image to ACR, run Alembic against PostgreSQL (private — use jump host or CI agent in VNet).
    Seed users with scripts/seed_api_user.py — not via Terraform.
  EOT
}
