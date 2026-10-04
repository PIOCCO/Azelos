# ACR pull / push blocked (Entra, Tasks, or both)

## Symptoms

| Error | Meaning |
|--------|---------|
| `AADSTS500014` … service principal … **disabled** | Entra blocks ACR token exchange (managed identity / `az acr login`). |
| `TasksOperationsNotAllowed` | **ACR Tasks** (`az acr build`) disabled on this subscription/registry. |

You do **not** need `az acr build`. Build with **Docker on your machine** (or GitHub Actions) and **push** with the registry **admin user**.

---

## Fast path (dev)

### 1. Turn on ACR admin (once)

Either in Terraform (`environments/dev/terraform.tfvars`):

```hcl
acr_admin_enabled = true
```

and `terraform apply`, **or** one-off:

```bash
az acr update --name dorabpdevacr8jw38 --admin-enabled true
```

(Use your real ACR name from `terraform output container_registry_name`.)

### 2. Build and push locally (no ACR Tasks)

From repo root:

```bash
chmod +x scripts/azure/push-app-image.sh
./scripts/azure/push-app-image.sh
```

Or manually:

```bash
cd infra/terraform/environments/dev
LOGIN=$(terraform output -raw container_registry_login_server)
ACR=$(terraform output -raw container_registry_name)
cd ../../..
docker build -f Dockerfile.app -t "$LOGIN/dora-bp-app:latest" .
az acr credential show -n "$ACR" --query username -o tsv   # needs admin enabled
PASS=$(az acr credential show -n "$ACR" --query 'passwords[0].value' -o tsv)
echo "$PASS" | docker login "$LOGIN" -u "$(az acr credential show -n "$ACR" --query username -o tsv)" --password-stdin
docker push "$LOGIN/dora-bp-app:latest"
```

`az acr credential show` uses **your** Azure CLI login (RBAC on the registry), not the broken Entra “Container Registry” enterprise app.

### 3. Point Container Apps at your image

In `terraform.tfvars`:

```hcl
acr_admin_enabled = true
container_image   = "<login-server>/dora-bp-app:latest"
integrate_container_apps_with_vnet = false   # if you use express CAE
```

`terraform apply`. With `acr_admin_enabled = true`, the app pulls ACR using **username/password** secrets (not managed identity).

If the revision still fails with **AADSTS500014** / **Identity proxy … ACR token**, Azure is still using **managed identity** on the registry (stale config). Either:

```bash
chmod +x scripts/azure/fix-containerapp-acr-admin.sh
./scripts/azure/fix-containerapp-acr-admin.sh
```

The fix script must use `az containerapp registry set --username … --password …`. Do **not** use `--password-secret` (invalid on current Azure CLI); the CLI may then **infer ACR via managed identity** and you will still see AADSTS500014.

Or recreate via Terraform (pull latest module with `replace_triggered_by` on pull mode):

```bash
terraform taint 'module.platform.module.compute.azurerm_container_app.app'
terraform apply -var-file=terraform.tfvars
```

Confirm `terraform output acr_pull_auth` is **`admin`**, not `managed_identity`.

If apply fails on **must supply both username and password_secret_name**, enable admin on the registry first, then re-apply:

```bash
terraform apply -var-file=terraform.tfvars \
  -target=module.platform.module.container_registry
terraform apply -var-file=terraform.tfvars
```

---

## Public image smoke test (no ACR at all)

If you only need infra up before any push:

```hcl
acr_admin_enabled = false
container_image = "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest"
```

Probes target port **8000**; hello-world uses **80** — revision may show not ready until you deploy the real app.

---

## When Entra is fixed (production-style)

1. Re-enable the **Azure Container Registry** enterprise application in Entra.
2. Set `acr_admin_enabled = false`, use `container_image` on `*.azurecr.io`, apply (managed identity + `AcrPull`).
3. Prefer `az acr login` + `docker push` or CI with a service principal — still **local/CI build**, not `az acr build`, if Tasks stay disabled.

---

## AADSTS500014 persists after admin registry fix

If `fix-containerapp-acr-admin.sh` runs but the revision **still** fails with **Identity proxy … ACR token** / **AADSTS500014**, Container Apps is routing **`*.azurecr.io`** pulls through Entra for this app (managed identity is attached). **Username/password on the registry does not bypass that path** while Entra’s ACR enterprise app is disabled.

**Workaround that works in dev:** host the image on **Docker Hub** (public) so the app never pulls from `azurecr.io`:

```bash
docker login
DOCKERHUB_USER=your-dockerhub-user ./scripts/azure/deploy-containerapp-dockerhub.sh
```

Then in `terraform.tfvars`:

```hcl
acr_admin_enabled = false
container_image   = "docker.io/your-dockerhub-user/dora-bp-app:latest"
```

Evidence files use **`STORAGE_PROVIDER=local`** in the container for this path (ephemeral disk; fine for dev smoke tests).

**Permanent fix:** tenant admin re-enables the subscription and the **Azure Container Registry** enterprise application; then return to `*.azurecr.io` + managed identity or admin as documented above.

---

## Container Apps: unsupported MIME type `…rootfs.diff.tar.gzip`

If revision provisioning fails with **BuildFailed** and **unsupported MIME type for compression** (often after `docker build` with the **legacy builder**), rebuild with **BuildKit/buildx** and push again:

```bash
docker login
export DOCKER_BUILDKIT=1
docker buildx create --name azelos-acr-builder --driver docker-container --use 2>/dev/null || docker buildx use azelos-acr-builder
docker buildx build --platform linux/amd64 --provenance=false --sbom=false \
  -f Dockerfile.app -t docker.io/YOURUSER/dora-bp-app:latest --push .
```

Or re-run `./scripts/azure/deploy-containerapp-dockerhub.sh` (uses buildx when available).

Use a **new tag** (e.g. `:v1`) in `az containerapp update --image` if the platform cached a bad manifest.

---

## Still stuck?

- **No Docker locally:** use GitHub Actions (build + push to Docker Hub or GHCR).
- **TasksOperationsNotAllowed:** Azure Support or use push-only (this doc); Tasks are optional.
- **Subscription lapsed:** renew subscription before any ACR/Entra path works reliably.
