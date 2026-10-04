# ADORA software licensing (customer-hosted)

ADORA remains **proprietary software** deployed in the **customer’s Azure subscription**. A **signed license envelope** controls entitlement (pilot, annual, internal dev).

## Architecture

| Component | Location |
|-----------|----------|
| **Private signing key** | Azelos licensing authority only (`ADORA_LICENSE_SIGNING_KEY_PEM` or file). **Never** in git, Docker image, or customer repo. |
| **Public key** | Shipped in the app (`backend/app/licensing/public_key.pem`) or override via `ADORA_LICENSE_PUBLIC_KEY_PEM` / `ADORA_LICENSE_PUBLIC_KEY_FILE`. |
| **License envelope** | JSON: `{ "format_version": 1, "payload": { ... }, "signature": "<base64url>" }` |
| **Verification** | `LicenseService` (Ed25519, canonical JSON payload) |
| **Enforcement** | `LicenseEnforcementMiddleware` on mutating `/api/v1/*` requests (after JWT org context) |
| **Storage** | PostgreSQL `organization_licenses` (verified envelope per `financial_entity_id`) |

## Payload fields

- `license_id`, `organization_id`, `customer_name`, `plan` (`PILOT` | `ANNUAL` | `INTERNAL`)
- `issued_at`, `starts_at`, `expires_at`
- `max_users`, `enabled_modules` (optional list; omit = all modules)
- `license_status` (`ACTIVE`, `SUSPENDED`, `REVOKED`, …)
- `product_version` (optional)

## Installation

**Option A — environment (recommended for Terraform / Container Apps):**

- `ADORA_LICENSE` — JSON envelope or base64url-encoded JSON
- `ADORA_LICENSE_FILE` — path to envelope file inside the container

On startup, the app verifies and upserts the license for `payload.organization_id`.

**Option B — ORG_ADMIN UI:**

- Settings → **Software license** → paste envelope → Install / Replace

**Revocation without redeploying the full license:**

- `ADORA_LICENSE_REVOCATIONS` or `ADORA_LICENSE_REVOCATIONS_FILE` — signed list of `{ license_id, revoked_at }` (same public key).

## Runtime behaviour

| State | Behaviour |
|-------|-----------|
| **Active** | Full use |
| **Expiring** (≤30/14/7/1 days) | Full use + admin/user banner warning |
| **Expired** | **Read-only**: GET, exports, login, license views; **no** creates/updates/uploads/invites |
| **Revoked / suspended** | Read-only (signed status or revocation list) |
| **Invalid / tampered** | Writes blocked; data **not** deleted |

## Enforcement toggle

- Production: **`ADORA_LICENSE_ENFORCEMENT=1`** (default when `APP_ENV=production`)
- Development/tests: `ADORA_LICENSE_ENFORCEMENT=0` (see `.env.example`)

## Sign a license (licensing authority)

```bash
export ADORA_LICENSE_SIGNING_KEY_FILE=/secure/path/azelos-license-signing.pem
cd backend
python scripts/licensing/sign_license.py \
  --organization-id "<financial_entity_uuid>" \
  --customer-name "Example EMI AG" \
  --plan PILOT \
  --starts-at "2026-01-01T00:00:00+00:00" \
  --expires-at "2026-04-01T00:00:00+00:00" \
  --max-users 10 \
  --out /tmp/adora-license.json
```

## Development example

Tests and local dev use a **deterministic dev key pair** (documented in code as **non-production**). See `backend/tests/licensing_utils.py` and `docs/licensing/example-development-license.json`.

Generate a fresh example for a specific org UUID:

```bash
cd backend
python scripts/licensing/generate_dev_license_example.py --organization-id "<uuid>"
```

## Audit events

Platform audit log entries use `entity_type=SoftwareLicense` for install, renew, validation failure, and user-limit blocks (no secrets logged).

## Limits

Customer-hosted deployments cannot provide perfect DRM against a hostile VM admin. This mechanism provides **cryptographic verification**, **server-side enforcement**, and **contractual** entitlement control—not invasive anti-tampering.
