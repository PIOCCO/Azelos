# Deployment

## Local (Docker Compose)

```bash
cp .env.example .env
docker compose up --build
```

- API: http://localhost:8090/api/v1/health  
- Dashboard: http://localhost:5175  
- Login: `provider@example.com` / `Provider123!`

## Azure (Terraform + script)

1. Copy `terraform/environments/dev/terraform.tfvars.example` → `terraform.tfvars`.
2. Set `subscription_id`, `alert_email`, `budget_start_date`.
3. Run:

```bash
./scripts/deploy.sh
```

The script verifies `az login`, applies Terraform, builds/pushes images to ACR, re-applies apps, and prints the **Azure-generated HTTPS URL** (`*.azurecontainerapps.io`).

## Post-deploy permissions

Assign roles to the API managed identity — see `AZURE_PERMISSIONS.md`.
