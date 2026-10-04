# Azelos First Customer Pilot Package

**Version:** 1.0 (product-aligned)  
**Audience:** EU payment institution / EMI, ~20–200 FTE, one legal entity, ≤10 users  
**Deployment default:** **Customer-hosted Azure** (single-tenant stack in customer subscription) — **not** Azelos-operated multi-tenant SaaS until ops gate is cleared ([`docs/SAAS-HOSTED-PRODUCT-REPORT.md`](../SAAS-HOSTED-PRODUCT-REPORT.md)).

**Facts** = verified in current codebase/docs. **Assumptions** = commercial/delivery choices to confirm in contract.

---

## 1. Customer profile

| Attribute | Target |
|-----------|--------|
| Entity type | Payment institution or EMI (DORA in scope) |
| Size | ~20–200 employees |
| ICT profile | Heavy cloud/SaaS; fragmented Excel/SharePoint registers |
| Scope | **1 legal entity**, **≤10 named users** |
| Buyer | ICT risk / TPRM + compliance; CISO sign-off on security |

---

## 2. Offer (what the pilot fee buys)

**Pilot fee (assumption):** **€6,000–€8,000** for **90 days** from kickoff (or environment handover, whichever is later).

**Included in the pilot fee:**

| Included | Detail |
|----------|--------|
| **Software licence (pilot term)** | One production-style environment (customer Azure), one tenant (`financial_entity`) |
| **Implementation (bounded)** | Up to **12 person-days** Azelos delivery (deploy assist, config, import, training, reviews)—not unlimited consulting |
| **Onboarding workshops** | **4 sessions** (kickoff, data/model, training, closeout) + **6 biweekly check-ins** (30–45 min) |
| **Support (pilot)** | Email + scheduled video; **business hours (CET)**; **P0** (app down / data loss risk) target response **1 business day**; **P1** **2 business days** (no 24/7 SOC) |
| **Documentation (pilot pack)** | Getting started, administration, operating guide (existing `docs/pilot/customer/*`) |
| **End-of-pilot deliverables** | Listed in §7 (register snapshot, exports, pilot report, gap list) |
| **Optional add-on (recommended)** | **DORA operational readiness memo** (fixed scope, §8)—often **included** in €7k pilot or **+€2k** if sold separately |

**Not included in pilot fee (priced separately if requested):**

- Full **implementation** beyond pilot caps → **€8k–€25k** SOW (see §16)  
- **Annual subscription** after pilot (see §16)  
- SSO/OIDC project, private VNet hardening, 24/7 support, unlimited migration, legal/regulatory advisory  

**Pilot fee credit (assumption):** **100% of pilot fee** credited to **Year 1 subscription** if annual contract signed within **30 days** of pilot end and scope unchanged.

---

## 3. Pilot scope (hard limits)

Purpose: prevent “implement our entire DORA programme for €7k.”

| Dimension | Pilot limit |
|-----------|-------------|
| Legal entities | **1** |
| Named users | **≤10** (roles: ORG_ADMIN, RISK_MANAGER, COMPLIANCE, BCM, AUDITOR read-only, etc.) |
| ICT providers (in scope) | **Up to 40 active** (customer designates **critical/material** subset; aim to load **≥30**) |
| Contracts | **Up to 60** linked to in-scope providers |
| ICT services | **Up to 80** |
| Business functions | **Up to 25** (incl. critical/important classification) |
| Function–service dependencies | **Up to 100** links |
| ICT / information assets | **Up to 80** records (light register—not full CMDB) |
| Sub-outsourcing records | **Up to 40** (where customer provides data) |
| ICT risk assessments | **Up to 40** (in-scope providers/contracts/services) |
| Contractual DORA controls (per contract) | **Status updates** on seeded control catalogue; **not** unlimited custom control library build |
| Requirements (org catalogue) | Baseline copied at provision; **status/owner** for **all copied rows**; no promise of full RTS article mapping project |
| Evidence files | **Up to 150** uploads (metadata + file); **≤5 GB** total storage (pilot) |
| Incidents | **Up to 20** records (historical + pilot period) |
| BCP / DR / resilience test records | **Up to 10** plans/campaigns combined |
| Resilience hub (findings/remediation/recovery tests) | **List/register use**; **≤20** findings, **≤20** remediation items entered (customer or joint)—UI is **list-oriented** for some objects |
| Integrations | **0–1** optional PostgreSQL or HTTP API **connection test** (ORG_ADMIN UI)—not ERP/ServiceNow connectors |
| Reporting | **JSON reports in app** + **provider CSV** + **one tenant ZIP export** at mid-pilot and end-pilot |
| Languages | **EN / FR** UI |

**Change control:** Anything above limits → **change order** (implementation SOW) or **post-pilot subscription** phase.

---

## 4. What is genuinely working today (facts)

Use this as the **sales/engineering truth table**. Do not promise beyond this.

| Workflow area | Working today | Limitations |
|---------------|---------------|-------------|
| Organization profile & onboarding wizard | Yes | Customer-owned data quality |
| Applicability | Computed from profile; **ORG_ADMIN toggles optional modules**; rule-required modules enforced | Not legal interpretation |
| Requirements | Baseline per org at provision; status/owner/notes | **Small seeded catalogue** vs full RTS library |
| Business functions, BIA page, dependencies | Create/edit in UI; BIA API-backed | Depth of BIA analytics limited |
| ICT providers | CRUD, CSV import/export on list | No automated vendor scoring |
| Contracts, ICT services, sub-outsourcing | CRUD + detail routes | — |
| ICT / information assets | Register pages | Not full CMDB |
| ICT risk | Multi-dimension assessments; **server-calculated** level | Customer owns judgement |
| Contract DORA controls | Read definitions; patch status per contract | Not unlimited custom controls |
| Evidence | Upload/download; types; links | Requirement linking **partially API**; no PDF report pack |
| Incidents, TLPT, BCP, DR, resilience tests | Operational registers; create in UI for several | **Not** regulatory incident submission |
| Resilience findings/remediation/recovery tests | API + **list UI** | Limited create UX on some screens |
| Relationship map | GraphQL graph; **layout persisted** per org | Requires linked data to be useful |
| Dashboard / DORA overview | KPIs from live data | — |
| Reports | **JSON** (`/resilience/reports/*`) in browser | **DORA assessment PDF** on Reports page; not full committee/RoI pack |
| Exports | Provider **CSV**; tenant **ZIP** (`GET /api/v1/tenant/data/export`, ORG_ADMIN) | ZIP not in main menu—documented procedure |
| Audit log | Platform audit records | Not enterprise SIEM |
| Users / RBAC / invites | Email/password; `/accept-invite` | **SSO:** env-level OIDC only, **not self-service** |
| Multi-tenant | Isolation by `financial_entity_id` | **Hosted SaaS ops not ready** for Azelos-run shared platform |
| Azure deploy path | Terraform modules + container image | Entra/ACR issues may require **Docker Hub image** workaround in some tenants |
| Azure Blob evidence | Optional (`STORAGE_PROVIDER=azure_blob`) | Local disk fine for pilot; blob needs MI/config |
| Integrations UI | PG + HTTP API test | No VPN/private connector product |

---

## 5. Deployment model (first customer)

**Recommended:** **Option A — Dedicated stack in customer Azure subscription** (single tenant, customer controls data plane).

### What gets deployed (facts — Terraform `infra/terraform/`)

| Component | Purpose | Customer-owned |
|-----------|---------|----------------|
| Resource group | Container | Yes |
| PostgreSQL Flexible Server 16 | Platform DB (all registers) | Yes |
| Container Apps (+ environment) | App (API + built UI :8000) | Yes |
| Key Vault | Generated secrets (DB password, JWT, connection strings) | Yes |
| Storage account | Evidence blob container (if `azure_blob`) | Yes |
| ACR | Optional; image may be **Docker Hub** if ACR/Entra blocked | Yes |
| Log Analytics / App Insights | Ops logs | Yes |
| Networking | Dev often **express** CAE + public PG firewall; prod may differ | Yes |

### What Azelos needs (for implementation)

- **Contributor** (or scoped) access to agreed RG/subscription **during implementation only**, or customer engineer runs Terraform with Azelos support  
- Read access to deployment outputs (FQDN, KV names—not secret values in email)  
- **Jump box / VPN** only if PostgreSQL is private (pilot default: **public PG + firewall rule** for dev-style stack—**security review required**)

### What customer retains

- Subscription billing, backup policy, PG retention, Key Vault access policies, TLS/DNS (if custom domain), user access governance, evidence retention/legal hold

### Secrets & identity (pilot)

- `DATABASE_URL`, `JWT_SECRET_KEY` → Container App secrets (from Terraform/KV)  
- Auth: **email/password** unless customer pays for OIDC cutover project  
- No Azelos certificate of compliance

### Updates & support access

- **Updates:** new container image tag + `terraform apply` or `az containerapp update`; Alembic on container start  
- **Support:** no standing production access unless **break-glass** in SOW (time-boxed, logged)

**Not offered for first pilot:** Azelos-hosted multi-tenant SaaS on Azelos subscription until internal **READY FOR CUSTOMER SaaS PILOT** gate is passed.

---

## 6. Implementation timeline (12 weeks / 90 days)

| Week | Azelos | Customer |
|------|--------|----------|
| **0** (pre-kickoff) | MSA/DPA/SOW signed; security questionnaire | Named sponsor + TPRM lead; NDA if needed |
| **1** | Kickoff; confirm scope limits; baseline metrics sheet; Azure prerequisites checklist | Provide provider list draft, org profile inputs, user list |
| **2** | Deploy stack (or assist customer deploy); bootstrap SUPER_ADMIN; **provision tenant** + ORG_ADMIN; `/ready` | Azure sub access; approve firewall IPs; validate URL |
| **3** | Org profile + applicability **walkthrough**; module toggles; import **≤40 providers** + **≤60 contracts** (agreed split) | Validate classifications; supply contract metadata |
| **4** | Services, functions, dependencies import; **relationship map** review session | Critical functions list; dependency validation |
| **5** | Risk assessments (in-scope); control statuses on key contracts; evidence upload structure | Risk workshops; first evidence batch |
| **6** | Requirements status pass; incidents/BCP/DR **as agreed** (minimal viable) | BCM input |
| **7–8** | Customer-led daily use; Azelos office hours (2×); fix **P0/P1** defects | Enter remaining in-scope data |
| **9** | Mid-pilot export (ZIP + CSV); gap list draft | Management review of map + dashboard |
| **10–11** | JSON reports walkthrough; remediation backlog in tool where used | Steerco prep |
| **12** | **Pilot closure report**; final export; conversion discussion | Sign success / gap acceptance; decision on annual |

**Effort cap:** **12 Azelos delivery days** included; extra days = change order.

---

## 7. Customer deliverables (end of pilot)

| # | Deliverable | Format | Notes |
|---|-------------|--------|-------|
| 1 | **Running Azelos environment** | HTTPS URL + admin handover | Customer Azure |
| 2 | **Configured tenant** | In-app | Profile, applicability reviewed, modules set |
| 3 | **ICT third-party register** | In-app + **CSV export** | Within scope limits |
| 4 | **Relationship map** | In-app | Provider→contract→service→function links |
| 5 | **ICT risk register snapshot** | In-app + export in ZIP | Calculated levels included |
| 6 | **Requirements tracker** | In-app | Baseline rows with statuses |
| 7 | **Control status (contractual)** | In-app | Seeded DORA-oriented controls |
| 8 | **Evidence inventory + gap list** | In-app + memo | Missing/expired called out in **pilot report** |
| 9 | **Resilience registers** | In-app | As scoped (incidents, tests, BCP/DR) |
| 10 | **Pilot closure report** | PDF **from Azelos** (services deliverable, not product button) | Coverage metrics, gaps, recommendations |
| 11 | **Operational readiness memo** (if in scope) | PDF | See §8 — **not certification** |
| 12 | **Tenant data export** | ZIP (API) | Portability snapshot |
| 13 | **Admin/operating documentation** | Markdown/PDF export of `docs/pilot/customer/*` | — |

**Not delivered:** EBA Register of Information submission file as marketed product; signed audit opinion; regulator-ready PDF pack from app button.

---

## 8. DORA readiness / maturity memo (optional but recommended)

**Include:** Yes, as **“DORA operational readiness memo”** (fixed **≤15 pages**).

**Scope (what Azelos assesses):**

- Coverage of **in-scope** registers vs agreed pilot limits  
- **Traceability** (provider→contract→service→function→risk→evidence)  
- **Evidence gaps** and open requirements statuses  
- **Tooling/process** observations (not law)

**Out of scope:**

- Legal conclusion of DORA compliance  
- Certification or regulatory approval  
- Gap analysis against **every** RTS/ITS article  
- External audit or inspection simulation  

**Disclaimer (contract + report header):**

> This memo reflects Azelos’s review of information maintained in the Azelos DORA BP workspace and related workshops during the pilot period. It is **not legal advice**, **not an audit opinion**, and **not a statement of regulatory compliance**. Compliance remains the sole responsibility of the financial entity and its governing bodies. The customer should rely on internal compliance, legal counsel, and competent authorities for regulatory interpretation.

---

## 9. Customer responsibilities

- **Executive sponsor** (steerco) and **project owner** (weekly contact)  
- **TPRM/ICT risk lead** (≥4 h/week in weeks 3–8)  
- **Compliance/legal** available for applicability/requirements **business decisions** (not Azelos)  
- **Accurate data** for in-scope providers, contracts, services, functions, risks  
- **Evidence files** customer is allowed to store  
- **User list** and timely **invite acceptance**  
- **Weekly or biweekly** pilot meeting (45 min)  
- **Security review** participation (Azure architecture, access, backup)  
- **Do not** treat Azelos as legal counsel or internal audit  

---

## 10. Azelos responsibilities

| Area | Responsibility |
|------|----------------|
| Deployment assistance | Terraform/runbook or paired deploy in customer sub |
| Tenant provision + ORG_ADMIN bootstrap | Yes |
| Configuration within **§3 limits** | Yes |
| Data import | **Up to 40%** of rows (rest customer); templates provided |
| Training | 4 workshops + recorded session (if agreed) |
| Product bugs | Fix P0/P1 in pilot window (best effort) |
| Pilot report + readiness memo | Yes (services) |
| Documentation | Ship pilot customer docs |
| **Not included** | Unlimited consulting, legal interpretation, regulator liaison, 24/7 ops unless contracted |

---

## 11. Out of scope (strict)

- DORA **certification** or “compliant” branding  
- **Legal advice** or regulatory interpretation  
- **Regulator submission** (RoI, incident notifications to NCA)  
- **Complete** EBA Register of Information **product** / validated export format  
- **Unlimited** data migration or historical load beyond §3  
- **Unlimited** users, entities, or providers  
- **Full enterprise GRC** replacement (OneTrust/ServiceNow parity)  
- **Guaranteed** regulatory outcome  
- **24/7 SOC** or managed incident response  
- **Automated** vendor due diligence / threat intel  
- **AI** contract review (unless separately built and contracted)  
- **Azelos-hosted** multi-tenant SaaS (until ops ready) unless explicitly re-scoped  
- **SSO self-service** (OIDC = implementation project)  
- **PDF reports from application UI** (JSON only today)  
- Physical DR execution or penetration testing  

---

## 12. Customer-facing package structure (send to prospect)

1. **Executive proposal** — Operational ICT TPRM + resilience workspace; problem = fragmented registers  
2. **Pilot scope** — §3 limits  
3. **Implementation plan** — §6  
4. **Deliverables** — §7  
5. **Customer responsibilities** — §9  
6. **Pricing** — §16  
7. **Success criteria** — §13 below  
8. **Out of scope** — §11  
9. **Legal/commercial assumptions** — §8 disclaimer; no certification  
10. **Conversion** — §15 below  

Existing internal references: [`docs/pilot/PILOT-PRODUCT-DEFINITION.md`](../pilot/PILOT-PRODUCT-DEFINITION.md), [`docs/pilot/ONBOARDING.md`](../pilot/ONBOARDING.md), [`docs/commercial/GO-TO-MARKET-STRATEGY.md`](./GO-TO-MARKET-STRATEGY.md).

---

## 13. Success criteria (measurable, negotiated at kickoff)

Agree numeric targets in writing (defaults below):

| Criterion | Default target |
|-----------|----------------|
| In-scope **critical ICT providers** registered | **≥80%** of customer’s agreed critical vendor list |
| Providers with **≥1 contract** | **≥75%** of registered in-scope providers |
| Contracts with **≥1 ICT service** | **≥70%** of in-scope contracts |
| **Critical/important functions** with ≥1 linked ICT service | **≥80%** of customer-identified functions |
| **ICT risk assessments** for critical providers | **100%** of agreed critical provider set |
| **Evidence** for **≥5** priority requirements/controls | Customer picks priority set at week 3 |
| **Relationship map** used in **≥1** management meeting | Customer attestation + screenshot/export |
| **ORG_ADMIN** generates **≥1 JSON report** without Azelos staff | Observed in week 10–11 |
| **Tenant export (ZIP)** completed successfully | End of pilot |
| **P0 defects** blocking daily use | **0** open at closure |

Failure to meet targets ≠ automatic refund; triggers **extend pilot**, **scope reduction**, or **paid Phase 2** decision.

---

## 14. Required contracts & documents (before onboarding)

| Document | Mandatory? | Should cover |
|----------|------------|--------------|
| **MSA** | Yes | Licence, liability cap, IP, confidentiality, term |
| **DPA (GDPR Art. 28)** | Yes if Azelos processes personal data on customer behalf | Roles, sub-processors, breach, deletion |
| **Pilot SOW** | Yes | §3 scope, §6 timeline, fees, success criteria, out of scope |
| **Order form / quote** | Yes | Price, entity name, user cap |
| **Security pack** | Yes (customer review) | Architecture diagram, data flows, RBAC, encryption, backups |
| **SLA** | Optional for pilot; required for annual | Hours, severity, exclusions |
| **Deployment runbook** | Yes (deliverable) | Azure components, secrets, update process |
| **Support policy** | Yes | Channels, hours, P0/P1 definitions |
| **Acceptable use / access policy** | If Azelos has break-glass access | Time-boxed access, logging |

Azelos does **not** need to draft law; **counsel** reviews MSA/DPA.

---

## 15. Customer onboarding journey & friction points

```text
Sales agreement (MSA + DPA + Pilot SOW)
    ↓
Kickoff (scope sign-off, baseline metrics)
    ↓  ← friction: unclear critical vendor list
Security review (Azure, access, DPA)
    ↓  ← friction: customer slow on InfoSec questionnaire
Deployment decision (customer Azure, single tenant)
    ↓  ← friction: Entra/ACR/region policy (use customer sub + Docker Hub image if needed)
Environment deployment + /ready
    ↓  ← friction: DB firewall, secrets, CORS URL
Bootstrap + tenant provision + ORG_ADMIN
    ↓
Data collection (templates)
    ↓  ← friction: contract metadata quality
Import + configuration (bounded)
    ↓
Training (4 sessions)
    ↓
Operational use (weeks 7–11)
    ↓  ← friction: adoption drops without sponsor
Biweekly reviews
    ↓
Pilot assessment + final export
    ↓
Pilot report + readiness memo
    ↓
Annual contract decision (30-day window for pilot credit)
```

---

## 16. Pricing structure (first customer recommendation)

| Line item | Price (EUR) | Includes |
|-----------|-------------|----------|
| **Pilot (90 days)** | **€6,000–€8,000** | §2: licence term, **12 delivery days**, support, closure report; readiness memo at **€7k+** or +€2k |
| **Implementation** (if sold with annual, not double-counted with pilot) | **€8,000–€12,000** standard / **€12,000–€25,000** heavy migration | Extra import, SSO project, private VNet, training beyond pilot |
| **Annual subscription** (Year 1 after pilot) | **€9,600–€14,400** (≤10 users, 1 entity) / **€14,400–€18,000** (upper ICP) | Right to use software, **8** support days/year, upgrades/migrations in releases, no unlimited consulting |
| **Pilot fee credit** | **100%** toward Year 1 if signed within **30 days** | — |

**USD:** quote **≈ USD/EUR parity +/− 5%** for US-domiciled parents paying USD.

**Payment terms (assumption):** 50% pilot fee at signature, 50% at go-live; annual prepaid or quarterly.

---

## 17. End-of-pilot → annual conversion

| Step | Action |
|------|--------|
| 1 | Joint review against §13 success criteria |
| 2 | Deliver final ZIP export + closure report |
| 3 | Customer signs **annual order** (subscription tier + support) |
| 4 | Pilot fee **credit** applied per SOW |
| 5 | New SOW for **Phase 2** scope (extra providers, SSO, blob storage hardening, private PG) if needed |
| 6 | **No** automatic price increase without order form |

If customer declines: export ZIP, **30-day** read-only optional (contractual), then **decommission** per DPA (delete tenant data).

---

## 18. Risks (commercial & delivery)

| Risk | Mitigation |
|------|------------|
| Product gaps vs RoI/regulator narrative | Scope §11; readiness memo ≠ compliance |
| Customer expects full GRC | Position as **operational register** |
| Azure deploy fragility (Entra/ACR/region) | Customer sub + Docker Hub image path documented |
| Adoption failure | Sponsor + weekly meetings + import split |
| Support overload on founder | Cap delivery days; change orders |
| Security blocks Azelos access | Customer-run Terraform with Azelos hours |
| Evidence storage ephemeral (local disk on ACA) | Contract **azure_blob** or customer ack of risk for pilot |

---

## 19. What must be fixed / agreed before accepting the first customer

**Must (blocking):**

1. **One successful end-to-end deploy** in a **customer-like** Azure sub with `/health` + `/ready` + login + provision + core workflow smoke test (documented checklist).  
2. **Pilot SOW + DPA + MSA** templates with counsel.  
3. **Security one-pager** (data residency, RBAC, encryption, backups responsibility).  
4. **Runbook:** bootstrap operator, provision tenant, backup/restore PG, image update.  
5. **Support channel** (email + ticketing) and P0/P1 definitions.  

**Should (highly recommended, not necessarily code):**

6. **Customer-facing PDF** of pilot closure report template (services).  
7. **Import templates** (CSV) for providers/contracts with validation doc.  
8. **CORS + URL** checklist item on every deploy.  
9. Clarify **tenant ZIP export** procedure for ORG_ADMIN (UI doc or admin button—product gap is UX only).  

**Explicitly not required for first pilot:**

- Azelos-hosted multi-tenant SaaS  
- PDF in-app reports  
- Full EBA RoI export product  
- SSO self-service  

---

## 20. Data onboarding — who does what

| Data | Primary owner | Azelos import (max) |
|------|---------------|---------------------|
| Organization profile | Customer | Guided in workshop |
| Provider list | Customer | **≤20 providers** imported by Azelos from customer spreadsheet |
| Contracts / services | Customer | **≤30 contracts** + services if structured sheet provided |
| Business functions & CIF | Customer | **≤15** with customer validation |
| Dependencies | Joint | **≤50** links |
| Assets | Customer | Optional light load **≤20** |
| Risks | Customer | Workshop; customer enters assessments (Azelos reviews **≤10**) |
| Requirements status | Customer | Azelos sets initial owners in kickoff config |
| Evidence files | Customer | Customer uploads (Azelos sets taxonomy + **≤10** samples) |
| BCP/DR / tests / incidents | Customer | Customer enters; Azelos **1** worked example each |
| Sub-outsourcing | Customer | As available |

**Customer provides:** Excel/CSV templates (Azelos-supplied column headers), PDF contracts for evidence (customer upload), workshop attendees.

---

*This package is intended to be attached to proposals and converted into Pilot SOW annexes. Update version when product ops gate or scope limits change.*
