# ACR pull fails — `AADSTS500014` / disabled service principal

## Symptom

Container App revision fails with `ContainerAppOperationError` / `BuildFailed`, and the message includes:

- `Identity proxy returned HTTP BadGateway for ACR token request`
- `AADSTS500014: The service principal for resource '…' is disabled`

This is a **Microsoft Entra ID** tenant issue: the enterprise application used for Azure Container Registry token exchange is disabled (subscription lapsed, tenant admin disabled the app, or a policy blocks it). **Terraform cannot fix this** inside your subscription.

## Dev workaround (deploy without ACR auth)

Use a **public** image so the Container App does not configure managed-identity ACR pull.

In `environments/dev/terraform.tfvars`:

```hcl
integrate_container_apps_with_vnet = false   # if you already use express CAE
container_image = "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest"
```

When `container_image` does **not** contain `.azurecr.io/`, Terraform sets `use_acr_registry = false`: no app `registry { identity = … }` block and no `AcrPull` role assignment.

```bash
cd infra/terraform/environments/dev
terraform apply -var-file=terraform.tfvars
```

The placeholder image listens on **port 80**; this stack’s probes use **port 8000** (`/health`, `/ready`). The revision may deploy but stay **not ready** until you use your real app image.

## Fix ACR for real images (tenant admin)

1. **Azure portal** → **Microsoft Entra ID** → **Enterprise applications** → search **Azure Container Registry**.
2. Ensure the application is **Enabled** (not disabled by admin or subscription state).
3. Confirm your subscription is **Active** (not disabled or expired).
4. Retry: `az acr login --name <acr-name>`, then build/push your image.

When `az acr login` works, set:

```hcl
container_image = "<terraform output container_registry_login_server>/dora-bp-app:latest"
```

Re-apply so managed identity ACR pull is configured again.

## Push the DORA app image (after Entra is fixed)

From repo root:

```bash
cd infra/terraform/environments/dev
LOGIN=$(terraform output -raw container_registry_login_server)
ACR_NAME=$(echo "$LOGIN" | cut -d. -f1)
cd ../../../..
az acr build -r "$ACR_NAME" -f Dockerfile.app -t dora-bp-app:latest .
```

Update `container_image` to `$LOGIN/dora-bp-app:latest` and apply.
