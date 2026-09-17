# Security

- **Secrets**: Stored in Azure Key Vault; not in Git. Use `.env` locally only.
- **Identity**: System-assigned managed identities on App Service, RSV where supported.
- **Encryption**: TLS 1.2+, PostgreSQL encryption at rest, storage encryption.
- **Network**: VNet integration ready; enable private endpoints for production hardening.
- **Terraform state**: Remote backend with RBAC + versioning; never commit state files.
- **Backup protection**: Soft delete on RSV, blob immutability (standard/resilient), retention locks (client policy).
- **CI/CD**: Plan/validate on PR; production apply requires manual workflow dispatch.
- **MFA**: Document assumption — break-glass accounts MFA enforced, no shared root.

Run IaC scans in CI (`tfsec`, `checkov`).
