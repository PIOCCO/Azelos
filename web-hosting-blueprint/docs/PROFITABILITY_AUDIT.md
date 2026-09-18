# Web Hosting Blueprint — Profitability Audit

**Audit date:** 2026-09-18  
**Basis:** Implementation audit in `PRODUCTION_AUDIT.md` — economics are **modeled**, not measured from live operations.

---

## 1. Target customer

**Best fit today:**

- Moroccan / regional **SMEs**, restaurants, agencies, and startups that need a **website or small web app** with HTTPS and someone to “keep it running.”
- Buyers **without** in-house DevOps.
- **Freelance agencies** deploying **one stack per client** on a dedicated VPS or Azure VM.

**Poor fit today:**

- Customers expecting a **login portal**, usage dashboards, or self-service deploys.
- High-traffic e-commerce or multi-tenant SaaS on **one shared server** without custom host nginx design.

Demand is **not quantified** in this repository — treat market appetite as an **operator assumption**.

---

## 2. Service definition

**What you can honestly sell with WHBP as-is:**

> **Managed deployment kit + operator labor:** we host your app on a dedicated server/VM using a standardized Docker stack (reverse proxy, app, database), configure DNS with you, install TLS certificates, run deployments from your repo/build, perform periodic backups, and respond to outages during business hours.

**Included (with operator work):**

- Containerized deploy (static, React/Vue frontends; Node/Python backends; PostgreSQL; optional Redis)
- Reverse proxy routing and basic security headers
- Health checks at deploy time
- Manual/scheduled Postgres backup script
- Redeploy via `deploy.sh`

**Excluded unless you build/process around it:**

- Automatic SSL renewal
- 24/7 monitoring and paging
- Customer-facing dashboard
- Billing portal
- Legal SLA unless contractually defined
- Content changes, SEO, email hosting

---

## 3. Revenue model (assumptions)

Use **your** local pricing; below are **illustrative** monthly recurring figures for modeling only:

| Package | Illustrative price (USD/mo) | Notes |
|---------|----------------------------|--------|
| **Hosting** | 15–40 | Static/small site, shared operator attention |
| **Managed hosting** | 40–90 | App + DB + backups + monthly patches |
| **Premium** | 90–200 | Priority support, staging, security reviews |

For **Morocco**, many agencies price in MAD; convert for margin math locally.

---

## 4. Cost model — infrastructure

### Fixed costs (per provider “cell” — one operator environment)

| Item | Assumption (verify with provider pricing) |
|------|-------------------------------------------|
| Azure VM `Standard_B2s` (2 vCPU, 4 GiB) | ~**$30–45/mo** compute + disk (East US–class; varies by region) |
| Or comparable VPS (4 GB) | ~**$20–40/mo** |
| Domain (if provider registers) | ~**$10–15/yr** per domain (often client-paid) |
| Let’s Encrypt | $0 |
| Monitoring SaaS (optional) | $0–26/mo (free tier vs paid) |
| Backup object storage (optional) | ~**$1–5/mo** per 50 GB |

**SSL, registry:** Usually $0 if building on VM; ACR not required for WHBP default flow.

### Per-customer incremental cost

| Customer type | Extra infra | Notes |
|---------------|-------------|--------|
| Small static | Low RAM | Often **one VM serves multiple sites only with extra host nginx** — not automated in WHBP |
| React/Node + Postgres | ~1–2 GB RAM | WHBP default: **one compose stack = one 80/443** → **dedicated VM or custom port/host proxy per client** |
| Standard + Redis | +256–512 MB | Same host constraints |

**Critical:** Default architecture implies **~1 full stack per small VM** unless you engineer multi-site host routing manually.

### Usage-dependent

- Egress/bandwidth (spiky for media-heavy sites)
- Support time (dominates margin at low scale)

---

## 5. Scenario modeling (illustrative)

Assumptions for table:

- **Managed hosting** at **$60/mo** revenue per customer (assumption)
- **One customer per B2s VM** at **$38/mo** infra (assumption)
- **Operator time** not fully loaded below — see §9

| Customers | Infra/mo (1 VM each) | Infra/mo (shared VM — manual) | Revenue/mo @ $60 | Gross infra margin |
|-----------|----------------------|--------------------------------|------------------|--------------------|
| 5 | ~$190 | ~$40–80 (1–2 VMs, risky) | $300 | $110–260 before labor |
| 10 | ~$380 | ~$80–160 | $600 | $220–520 before labor |
| 25 | ~$950 | Not realistic without redesign | $1,500 | Requires multi-tenant host design |
| 50+ | — | Requires automation + platform | — | WHBP not ready without major ops investment |

**Break-even (infra only, 1 VM per customer @ $38 vs $60):** ~**1 paying customer** covers one VM; **second customer** begins infra contribution if VM shared — but sharing is **not** blueprint-automated.

**Real break-even** must add **hours × rate** for deploy, DNS, TLS, tickets (often **5–15+ hours/client/year** for managed SMB).

---

## 6. Gross contribution (formula)

```text
Gross contribution ≈
  Monthly fee
  − (allocated VM/storage/backup/monitoring)
  − (variable minutes × internal cost rate)
```

WHBP **reduces** repeat deploy time vs ad-hoc Docker but **does not eliminate** support.

---

## 7. Operational workload

| Step | Manual today | Acceptable at 1–5 clients | Problematic at 10–25 | Must automate at 50+ |
|------|--------------|---------------------------|----------------------|---------------------|
| Lead / contract | Manual | Yes | Yes | CRM |
| Onboarding questionnaire | Manual | Yes | Yes | Portal |
| Client YAML authoring | Manual | Yes | Tedious | Generator UI |
| DNS | Manual | Yes | Yes | API/docs only |
| TLS | Manual certbot | Yes | Error-prone | ACME in BP |
| Deploy | `./deploy.sh` | Yes | OK | CI + approvals |
| Monitoring | None in BP | Risky | Critical | Uptime + SSL |
| Backup cron | Manual cron | Yes | Miss risk | Scheduled + alert |
| Restore drill | Manual | Rare | Required | Automated test |
| Updates | Manual | Yes | Heavy | Pipeline |
| Billing | External | Yes | Yes | Stripe/invoices |

---

## 8. Recurring-value mechanism

Customers pay monthly because:

- Domain/DNS/HTTPS complexity removed **for them**
- Uptime and backup **promise** (must be backed by process)
- Someone redeploys fixes without them learning Docker

WHBP supports **standardization** of that delivery; it does **not** by itself create recurring value — **operator process + contract** does.

---

## 9. Risks (commercial)

1. **Overpromising** SSL, rollback, or “multi-tenant hosting” on one server.  
2. **Support drag** from underpriced managed plans.  
3. **Single VM failure** without DR — no blueprint DR for app tier.  
4. **No billing** → cash leakage and scope creep.  
5. **Security incident** on shared host if multi-customer routing done ad hoc.

---

## 10. Commercial prerequisites before “productized service”

1. Written **SLA/support boundaries** (what is included/excluded).  
2. **Runbooks:** deploy, rollback, restore, TLS renewal, incident.  
3. **Monitoring + alerting** external to WHBP.  
4. **TLS automation** or strict calendar process.  
5. **Pricing** that covers expected support minutes.  
6. Optional: lightweight **customer status page** (even static Notion + uptime robot).

---

## Profitability readiness (no score)

**Commercial status: READY WITH CONDITIONS**

You can run a **profitable freelance managed hosting practice** if you:

- Price for **labor**, not just VM cost  
- Deploy **one primary client per VM** (or invest in host-level multi-site)  
- Add **monitoring and TLS process** outside current automation gaps  

You **cannot** honestly sell a **self-service multi-tenant hosting SaaS** based on this blueprint alone.
