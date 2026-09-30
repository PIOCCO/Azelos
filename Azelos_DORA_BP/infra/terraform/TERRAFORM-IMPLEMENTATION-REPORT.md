# Terraform Implementation Report

## Infrastructure created (when applied)

Terraform manages the following Azure resources per environment (`dev`, `staging`, `prod`):

| Resource | Module |
|----------|--------|
| Resource group | `resource_group` |
| Virtual network + subnets (Container Apps, PostgreSQL, private endpoints) + NSGs | `networking` |
| Private DNS zone (PostgreSQL) | `networking` |
| Log Analytics workspace | `monitoring` |
| Application Insights | `monitoring` |
| Key Vault (RBAC) | `key_vault` |
| Container Registry (admin disabled) | `container_registry` |
| Storage account + `evidence` / `exports` containers | `storage` |
| PostgreSQL Flexible Server 16 + app database | `postgres` |
| Container Apps Environment + Container App | `compute` |
| Key Vault secrets (passwords, DATABASE_URL, JWT) | `platform` |
| RBAC: deployer → KV Secrets Officer; app MI → AcrPull, KV Secrets User, Storage Blob Data Contributor | `platform` / `compute` |
| Diagnostic settings (PostgreSQL, Storage) | `postgres`, `storage` |

Bootstrap (separate root, local state): RG + Storage Account + `tfstate` container for remote backend.

## Terraform structure

```
infra/terraform/
├── ARCHITECTURE-ASSESSMENT.md
├── README.md
├── TERRAFORM-IMPLEMENTATION-REPORT.md
├── bootstrap/
├── modules/{resource_group,networking,postgres,key_vault,storage,container_registry,monitoring,compute,platform}
└── environments/{dev,staging,prod}/
```

## Architecture

**Internet → Container Apps HTTPS ingress → single container (FastAPI + static UI :8000) → private PostgreSQL; Key Vault secret refs; Storage for evidence metadata/files.**

Alembic migrations and seeds run **outside** Terraform after connectivity to private PostgreSQL is established.

## Security controls

- PostgreSQL private access only (`public_network_access_enabled = false`)
- NSGs on subnets (no internet→5432 rules)
- ACR admin disabled; image pull via user-assigned managed identity
- Key Vault RBAC; optional IP allow list for bootstrap
- Storage HTTPS-only, private blob containers
- Secrets generated via `random_password`, stored in Key Vault; Container Apps use KV references
- No secrets in Terraform outputs (passwords not output)

## State

- **Bootstrap:** local state (one-time) creates Azure Storage backend.
- **Environments:** `backend "azurerm"` with per-env state key (`dev.terraform.tfstate`, etc.) — configure via `backend.hcl` (not committed).

## Secrets handling

| Secret | Mechanism |
|--------|-----------|
| PostgreSQL admin password | `random_password` → KV `postgresql-admin-password` |
| JWT | `random_password` → KV `jwt-secret-key` |
| DATABASE_URL | Composed in TF → KV `database-url` (sensitive) |
| App runtime | Container App secret refs + managed identity to KV |

## Networking

- VNet `10.40.0.0/16` (default) with delegated subnets for ACA and PostgreSQL.
- Public ingress only on Container Apps FQDN; database not internet-published.

## Backup / recovery

| Env | PG backup retention | Geo-redundant backup |
|-----|---------------------|----------------------|
| dev | 7d | no |
| staging | 14d | no |
| prod | 35d | yes |

RPO/RTO depend on Azure SKU and validated restore drills — **not guaranteed by this document alone**.

## Tests executed (this run)

| Check | Result |
|-------|--------|
| `terraform fmt -check -recursive` | **Pass** (after fmt) |
| `terraform init -backend=false` (dev) | **Pass** |
| `terraform validate` (dev) | **Pass** |
| `terraform plan` (Azure) | **Not run** — requires `az login` + subscription |
| `terraform test` (platform module) | Run in CI/local with mocks — see module `tests/platform.tftest.hcl` |
| tfsec / Checkov | **Not run** (optional; install locally) |
| Application pytest / frontend build | **Not re-run this Terraform-only change** |

## Existing infrastructure / import

- **No Azure resource IDs in repository.** If resources already exist in your subscription, use `terraform import` before apply or choose new names/environment.
- **Do not destroy** existing production resources to align state.

## Remaining issues for production

1. Build/push `Dockerfile.app` image to ACR before Container App becomes healthy.
2. Run Alembic from VNet-connected runner (PostgreSQL is private).
3. Complete `azure_blob` storage adapter in app if evidence upload to Blob is required (infra env vars are set; SDK wiring may still be stub).
4. Configure Azure AD / CI secrets for GitHub `plan` job (`AZURE_*` secrets).
5. Optional: Front Door, private endpoints for KV/Storage, Container Apps Job for migrations.

## Deployment commands

### Bootstrap state (once)

```bash
cd Azelos_DORA_BP/infra/terraform/bootstrap
terraform init && terraform plan && terraform apply
```

### Dev

```bash
cd Azelos_DORA_BP/infra/terraform/environments/dev
cp backend.hcl.example backend.hcl   # fill from bootstrap outputs
cp terraform.tfvars.example terraform.tfvars
terraform init -backend-config=backend.hcl
terraform plan
terraform apply
```

### Staging / Prod

Same under `environments/staging` or `environments/prod` with **manual approval** before `apply`.
