# Early external tester / design partner — operator playbook

**Purpose:** Safely onboard **one** external person (e.g. LinkedIn design partner) to test realistic ADORA workflows without exposing internal infrastructure, other tenants, or secrets.

**Not a commercial customer deployment.** Use this before a paid customer-hosted pilot.

**Product state (inspected):** Multi-tenant by `financial_entity_id`; JWT login; ORG_ADMIN provisioning via SUPER_ADMIN; invite flow **without outbound email** (manual link); Ed25519 **license enforcement** in production; audit log; fictional demo seed (`seed_pilot_demo.py`) exists but must **not** be shared with external testers on a shared dev laptop.

---

## A. Recommended testing architecture

### Options compared (actual codebase)

| Option | Description | Isolation | Ops effort | Verdict for **first external tester** |
|--------|-------------|-----------|------------|--------------------------------------|
| **A — Extra org on existing deployment** | Same PostgreSQL + same Container App; new `FinancialEntity` via `POST /api/v1/tenant/provision` | **Logical** (API/repos scope by `financial_entity_id`; cross-tenant tests exist) | Low | **Only if** the deployment has **no** other tenants’ real data, **no** shared demo logins, and operators never give tester SUPER_ADMIN |
| **B — Separate ADORA deployment** | Second stack (second compose profile, second ACA, second DB) | **Strong** | Medium | **Recommended minimum** |
| **C — Separate Azure (customer-style)** | Tester or Azelos subscription with dedicated PG + ACA | **Strongest** | Higher | Best when aligning with **customer-hosted** story; not required for a 2–4 week design test |

### Recommendation

Use **Option B: dedicated tester environment** (single tenant in practice):

```text
Tester environment (isolated URL + isolated PostgreSQL)
  └── One FinancialEntity: "ADORA Early Design Partner" (or neutral name)
        └── ORG_ADMIN = tester (their email)
        └── Optional: 1–2 colleague invites (ORG_ADMIN sends invite link manually)
```

**Do not** put the tester in:

- Your personal dev compose DB that also has Nordhaven demo / operator experiments  
- Any environment with **SUPER_ADMIN** credentials shared with the tester  
- Azelos-hosted multi-tenant SaaS until [`SAAS-HOSTED-PRODUCT-REPORT.md`](../SAAS-HOSTED-PRODUCT-REPORT.md) ops gate is cleared  

**Option A** is acceptable later on a **clean, single-purpose** hosted instance with multiple design partners—each with their own org and **PILOT license** bound to `organization_id`.

---

## B. Exact setup steps (operator)

### Prerequisites (Azelos)

- [ ] Isolated environment URL with **HTTPS** (see §14)  
- [ ] `APP_ENV=production`, strong `JWT_SECRET_KEY` (≥32 chars), tight `CORS_ORIGINS` = tester URL only  
- [ ] `ADORA_LICENSE_ENFORCEMENT=1`  
- [ ] Production license **public key** (`ADORA_LICENSE_PUBLIC_KEY_FILE`) — not the dev key bundled in the image  
- [ ] Evidence storage: **persistent** (`azure_blob` + MI, or Docker volume on `/app/storage`)  
- [ ] Operator runbook access only (no tester access to Azure/Postgres)

### 1. Deploy isolated stack

**Minimal (Azelos-controlled VPS / compose):**

```bash
cd Azelos_DORA_BP
export JWT_SECRET_KEY="$(openssl rand -hex 32)"
export APP_ENV=production
export CORS_ORIGINS=https://pilot.your-domain.example
export ADORA_LICENSE_ENFORCEMENT=1
# Optional: ADORA_LICENSE=<signed envelope JSON or base64>
docker compose --profile full up --build -d
curl -sS https://pilot.your-domain.example/ready
```

**Azure (aligned with customer-hosted):** follow [`docs/customer-hosted/DEPLOYMENT-VALIDATION-REPORT.md`](../customer-hosted/DEPLOYMENT-VALIDATION-REPORT.md) and [`infra/terraform/`](../infra/terraform/README.md) in a **dedicated** resource group used only for external testers.

Migrations run automatically via `docker-entrypoint.sh` → `alembic upgrade head`.

### 2. Bootstrap platform operator (Azelos only — never share)

```bash
docker compose exec backend python scripts/bootstrap_platform_operator.py \
  --email operator@azelos.example \
  --password '<strong-operator-password>'
```

Login as SUPER_ADMIN only from Azelos networks/VPN if possible.

### 3. Create tester organization + ORG_ADMIN

**UI:** `/admin/provision` (SUPER_ADMIN)  
**API:**

```bash
curl -sS -X POST https://pilot.your-domain.example/api/v1/tenant/provision \
  -H "Authorization: Bearer $SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "legal_name": "ADORA Early Design Partner",
    "country_code": "DE",
    "admin_email": "tester@their-company.example",
    "admin_password": "<temporary-password-min-12-chars>"
  }'
```

Save returned **`organization_id`** (UUID).

**Do not** reuse Nordhaven demo credentials from `seed_pilot_demo.py` for external testers.

### 4. Install signed PILOT license (required in production)

On licensing authority (Azelos only):

```bash
export ADORA_LICENSE_SIGNING_KEY_FILE=/secure/path/production-signing.pem
cd backend
python scripts/licensing/sign_license.py \
  --organization-id "<organization_id from step 3>" \
  --customer-name "ADORA Early Design Partner" \
  --plan PILOT \
  --starts-at "2026-04-01T00:00:00+00:00" \
  --expires-at "2026-07-01T00:00:00+00:00" \
  --max-users 5 \
  --out /tmp/tester-license.json
```

Deploy envelope:

- Set Container App secret / env `ADORA_LICENSE` (JSON or base64), **or**  
- ORG_ADMIN → Settings → **Software license** → paste envelope → Install  

Verify: Settings → license shows **ACTIVE**, days remaining, max users.

### 5. Synthetic starter data (optional, operator-only)

**Preferred for design partners:** empty org + tester builds data via test plan (Tasks 2–7).

**Optional pre-load (fictional only):** operator runs internal scripts on the **tester DB only**—never copy real customer data. Patterns:

- Reuse logic from `scripts/seed_pilot_demo.py` with a **different** `legal_name` and **tester’s email** (custom script or manual UI entry).  
- Or CSV import: `POST /api/v1/import/ict-providers.csv` as SECURITY_MANAGER after granting role.

Target synthetic volume (if pre-loading):

| Object | Count |
|--------|------:|
| ICT providers | 5 |
| Contracts | 8 |
| ICT services | 6 |
| Business functions | 5 |
| Dependencies | 4 |
| ICT risks | 5 |
| Control statuses | 6 |
| Evidence (PDF) | several |
| Incidents | 2 |
| Resilience tests | 2 |
| Findings | several |

All names must be **fictional** (e.g. “Fictional Cloud AG”, not real vendors).

### 6. Hand credentials to tester (secure channel)

- URL: `https://pilot.your-domain.example`  
- Email + **temporary** password (force change on first login if you add process—or send strong unique password via password manager / Signal, **not** email body if avoidable)  
- Link to [`customer/EARLY-TESTER-GUIDE.md`](./customer/EARLY-TESTER-GUIDE.md)  
- Data protection reminder (no confidential uploads)

### 7. Inviting a second tester user (same org)

ORG_ADMIN → Settings → Users & access → Invite → copy **Accept invitation** link (no SMTP in product today). Send link via secure channel.

---

## C. Tester journey

```text
Azelos sends URL + credentials (secure)
    ↓
Login (email/password) — same as production customer flow
    ↓
Policy acceptance (if POLICY_ACCEPTANCE_ENFORCED=1)
    ↓
Dashboard (empty or synthetic counts)
    ↓
Get started / Organization profile (tester completes entity type/size)
    ↓
Applicability review (ORG_ADMIN may toggle optional modules)
    ↓
Required test plan (providers → map → risk → evidence → export)
    ↓
Optional exploration
    ↓
Feedback form + bug reports (email/Notion — not in-app)
    ↓
End-of-test review call
```

Tester **never** sees: `/admin/provision`, other organizations, operator SUPER_ADMIN, Azure Portal, database URLs.

---

## D. Tester test plan (concise)

**Scenario:** European payment institution; several SaaS/cloud ICT providers; understand dependencies, risks, controls, evidence, resilience.

### Required (main DORA chain)

| # | Task | Success signal |
|---|------|----------------|
| 1 | Explore Dashboard, Providers, Contracts, Services, Functions, Relationship map | Can narrate provider → service → function |
| 2 | Create provider → contract → ICT service | Visible on map |
| 3 | Link service to business function (Dependencies) | Map shows path |
| 4 | Create or update ICT risk | Calculated level visible |
| 5 | Update a contract control status | Status saved |
| 6 | Upload synthetic PDF evidence; view/download/delete on hover | File works |
| 7 | Relationship map: “If provider X fails, what functions?” | Can trace in UI |
| 8 | Export: providers CSV; generate DORA assessment PDF; ORG_ADMIN tenant ZIP (documented steps) | Files open |

### Optional

- Requirements status updates  
- Incidents, BCP/DR, resilience tests, findings  
- JSON reports on Reports page  
- EN/FR language switch  

Allow free exploration; do not force every module.

Full narrative: [`DEMO-SCENARIO.md`](./DEMO-SCENARIO.md) (adapt names for tester org).

---

## E. Security checklist (before sharing URL)

| Check | How |
|-------|-----|
| Tenant isolation | Tester JWT only includes their `org_id`; APIs return 404 for other org UUIDs (see `test_ict_chain_customer.py`, `test_tenant_integrations.py`) |
| No SUPER_ADMIN for tester | Role is ORG_ADMIN / invited roles only |
| No shared demo tenant | Do not give `pilot.admin@pilot-demo.example` credentials |
| No secrets in UI | Settings → license shows status, not signing keys |
| HTTPS only | TLS on public URL |
| CORS | Only tester origin |
| License | Valid signed PILOT for their `organization_id` |
| Operator access | Break-glass only; not standing Contributor on tester subscription unless contracted |
| Logs | No DATABASE_URL/JWT in browser; avoid sharing server logs with tester |
| Exports | ZIP/CSV contain **their** tenant only |

**Manual smoke (operator):** log in as tester; attempt to open `/admin/provision` → blocked; attempt API with another org UUID in path → 403/404.

---

## F. Feedback template

Send: [`templates/EXTERNAL-TESTER-FEEDBACK-QUESTIONNAIRE.md`](./templates/EXTERNAL-TESTER-FEEDBACK-QUESTIONNAIRE.md)

Store responses in: [`templates/EXTERNAL-TESTER-RECORD.md`](./templates/EXTERNAL-TESTER-RECORD.md) (one file per tester).

Also reuse: [`FEEDBACK.md`](./FEEDBACK.md), [`CUSTOMER-INTERVIEW-GUIDE.md`](./CUSTOMER-INTERVIEW-GUIDE.md).

---

## G. Production-readiness gaps (external tester gate)

| Gap | Blocks external tester? | Mitigation |
|-----|-------------------------|------------|
| No outbound email for invites | No | Manual invite link (Settings → Users) |
| No dedicated tester seed script | No | Empty org or operator synthetic load |
| Azure E2E not smoke-tested in CI | **Yes for Azure path** | Use compose/VPS **or** complete one Azure smoke checklist |
| Dev license public key in image | **Yes if enforcement on** | Production public key + signed PILOT license |
| Ephemeral evidence on ACA `/tmp` | **Yes for blob-off deploys** | Volume or `azure_blob` |
| Hosted multi-tenant SaaS ops | Yes for **shared Azelos SaaS** | Use **dedicated tester environment** instead |
| Policy acceptance on first login | Minor | Document checkbox step in tester guide |
| Tenant ZIP not in main nav | No | Document ORG_ADMIN API/procedure in guide |

**Verdict:** Ready for **one external design partner** when Azelos operates a **dedicated environment**, provisions **one isolated org**, installs a **signed PILOT license**, and uses **HTTPS + secure credential delivery**. Not ready to hand out a shared internal dev instance.

---

## What exists vs what to configure (§20 summary)

| | |
|--|--|
| **Already exists** | Tenant provision, RBAC, invite accept, audit log, license system, CSV import, demo seed (internal), pilot docs, cross-tenant tests |
| **Reuse** | `tenant/provision`, Members invite UI, licensing scripts, `OPERATOR-RUNBOOK.md`, feedback questionnaires |
| **Configure only** | New URL, secrets, CORS, license, org, roles, optional synthetic data |
| **Do not implement now** | Email SMTP, in-app feedback widget, auth bypass, global license off |
| **Do not change** | Core tenant model, licensing crypto, RBAC hierarchy |
| **Deployment model** | **Dedicated tester environment** (Option B), single org, production auth path |

---

## Related files

| Topic | Path |
|-------|------|
| Tester-facing guide | [`customer/EARLY-TESTER-GUIDE.md`](./customer/EARLY-TESTER-GUIDE.md) |
| Bug report template | [`templates/EXTERNAL-TESTER-BUG-REPORT.md`](./templates/EXTERNAL-TESTER-BUG-REPORT.md) |
| Operator runbook | [`OPERATOR-RUNBOOK.md`](./OPERATOR-RUNBOOK.md) |
| Licensing | [`../licensing/README.md`](../licensing/README.md) |
