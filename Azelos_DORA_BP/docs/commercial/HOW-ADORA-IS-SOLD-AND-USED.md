# How ADORA Is Actually Sold and Used

**Product:** ADORA (Azelos DORA Business Process — operational ICT third-party & resilience workspace)  
**Audience:** Founders, sales, delivery, and prospects who need a brutally honest V1 picture  
**Date:** October 2026  
**Rule:** Describes **what exists today** in `Azelos_DORA_BP`. Facts vs gaps are labeled explicitly.

**Related:** [`Azelos-First-Customer-Pilot-Package.md`](./Azelos-First-Customer-Pilot-Package.md), [`GO-TO-MARKET-STRATEGY.md`](./GO-TO-MARKET-STRATEGY.md), [`../SAAS-HOSTED-PRODUCT-REPORT.md`](../SAAS-HOSTED-PRODUCT-REPORT.md), [`../pilot/`](../pilot/).

---

## 1. Current product inspection (truth table)

### Working today

| Area | What works |
|------|------------|
| **Tenant & auth** | Email/password login; org scoped by `financial_entity_id`; invite via `/accept-invite`; roles: `ORG_ADMIN`, `RISK_MANAGER`, `SECURITY_MANAGER`, `BUSINESS_CONTINUITY_MANAGER`, `AUDITOR`, `USER`; operator `SUPER_ADMIN` + tenant provision |
| **Onboarding** | Get-started wizard; organization profile (entity type, size, regulatory inputs) |
| **Applicability** | Rules engine from profile; **ORG_ADMIN can enable/disable optional modules** (`ApplicabilityPage` + API); nav hides disabled modules |
| **Requirements** | Baseline catalogue copied at provision; status, owner, notes in UI |
| **ICT chain** | Providers (CSV import/export on list), contracts, ICT services, sub-outsourcing, business functions, dependencies, ICT assets — CRUD in UI |
| **ICT risk** | Assessments with dimension inputs; **server-calculated** risk level (versioned) |
| **Contract DORA controls** | Seeded control definitions per contract; status patch in **Controls** UI; evidence can attach to controls (PDF panel) |
| **Evidence** | Upload/download; metadata in DB; bytes on configured storage (`local` or `azure_blob`); **PDF-only** attachments on several entity panels |
| **Incidents** | Register with lifecycle fields; links where supported |
| **Resilience** | BCP, DRP, resilience test campaigns; resilience hub / DORA overview KPIs |
| **Findings / remediation / recovery tests** | API + **list-oriented UI** (read/paginate; limited create UX on some screens) |
| **Relationship map** | GraphQL graph; pan/zoom; **layout persisted** per org (`PUT /api/v1/dora/relationship-map/layout`) |
| **Dashboard & DORA overview** | Counts and statuses from live data |
| **Reports** | JSON reports in browser (`/resilience/reports/*`) |
| **Exports** | Provider CSV (UI + API); **DORA assessment PDF** (`Reports` → export); tenant **ZIP** via `GET /api/v1/tenant/data/export` (**ORG_ADMIN**, not main nav) |
| **Audit trail** | Platform audit log page (admin); not a SIEM |
| **Integrations** | ORG_ADMIN UI: PostgreSQL + HTTP API connection test (encrypted secrets in DB) |
| **i18n** | EN / FR UI |
| **Deploy path** | Docker single container; Terraform Azure stack (`infra/terraform/`); Alembic on container start; `/health`, `/ready` |
| **Global search** | **Navigation jump** (routes/keywords EN+FR), not full-text search across registers |

### Partially working / operational but basic

| Area | Reality |
|------|---------|
| **Requirements ↔ evidence linking** | API exists; **no dedicated UI** to link after upload (workaround: status/notes; control/evidence PDF panels; operator/API for links) |
| **Regulatory catalogue** | **Small seeded baseline**, not full RTS/article library or validated EBA Register of Information product |
| **PDF outputs** | **One** in-app PDF (DORA assessment snapshot); not a full committee pack or RoI submission file |
| **Resilience sub-modules** | Registers work; some objects are **list-only** in UI |
| **BIA** | Page + API; analytics depth limited |
| **Azure evidence blob** | Supported with config; pilot often uses local disk on Container Apps unless customer configures blob + MI |
| **OIDC / SSO** | Deployment-level env hooks; **not self-service** in product UI |
| **Rate limiting** | In-memory (single-instance caveat) |
| **Customer docs** | Some pilot markdown still says applicability “read-only” or map “session-only” — **code is ahead of those lines** |

### Not ready / not implemented (do not sell)

| Item | Status |
|------|--------|
| **Azelos-hosted multi-tenant SaaS** | [`SAAS-HOSTED-PRODUCT-REPORT.md`](../SAAS-HOSTED-PRODUCT-REPORT.md): **NOT READY FOR CUSTOMER SaaS PILOT** |
| **DORA certification / auto-compliance / regulator approval** | Out of scope |
| **NCA incident submission / EBA RoI validated export product** | Not marketed-ready |
| **Enterprise GRC parity** | No |
| **Automated vendor scoring / threat intel / AI contract review** | No |
| **VPN / private connector agent for customer DB** | Documented gap |
| **Per-tenant routing of all data to customer PostgreSQL** | Not architecture |
| **24/7 SOC / managed IR** | Services not product |

---

## 2. Product in customer language

### What is ADORA?

ADORA is a secure web workspace where your firm keeps **one connected picture** of ICT providers, contracts, services, critical business functions, risks, DORA-oriented requirements, evidence, and resilience records. Instead of hunting through spreadsheets and SharePoint folders, teams **register and link** what they already know, see dependencies on a **relationship map**, and pull **dashboards, reports, and exports** for oversight.

### What problem is the customer buying ADORA to solve?

Problems ADORA **actually** addresses today:

- **Fragmented Excel/SharePoint registers** for ICT third parties and contracts  
- **No traceability** from provider → service → critical function → risk → control/evidence  
- **Disconnected ICT provider information** (contracts, services, sub-outsourcing not in one chain)  
- **Difficulty showing which providers support which critical functions**  
- **Evidence scattered** across folders without clear links to requirements/controls  
- **Difficulty tracking ICT risks** in a consistent register with calculated levels  
- **Difficulty preparing for internal assessments** with a single exportable snapshot  
- **Lack of centralized DORA operational information** for TPRM and resilience teams  

ADORA does **not** replace legal interpretation, external audit, or regulator submissions.

---

## 3. What the customer actually buys

### Software

- Licensed use of ADORA (web UI + API) for **one legal entity** (pilot/Year 1 ICP)  
- Registers: providers, contracts, services, functions, assets, dependencies, risks, requirements, controls, evidence, incidents, BCP/DR/tests, resilience lists  
- Relationship map, dashboard, DORA overview, JSON reports, CSV/PDF/ZIP exports as implemented  
- EN/FR UI; RBAC; audit log; tenant isolation  
- **Deployment:** customer-hosted stack (default) or customer-managed Postgres + container elsewhere  

### Implementation (bounded)

- Azure (or agreed host) deploy assistance  
- Operator bootstrap + **tenant provision** + first **ORG_ADMIN**  
- Organization profile + applicability/module walkthrough  
- **Partial data import** (caps in pilot SOW — not full historical migration)  
- Workshops and biweekly check-ins during pilot  

### Support

- Business-hours email/video (CET); P0/P1 targets in pilot package  
- Product defect fixes (best effort in pilot window)  
- **Not** unlimited consulting or legal advice  

### Optional services (legitimate, not pretending to be audit firm)

- Extra implementation/migration beyond pilot caps (**€8k–€25k** SOW)  
- **DORA operational readiness memo** (fixed-scope PDF from Azelos — **not certification**)  
- SSO/OIDC cutover project  
- Private VNet / hardened PostgreSQL networking  
- Extra training sessions  
- Phase 2 scope (more providers, blob hardening, etc.)  

---

## 4. Complete commercial journey

```text
LinkedIn / referral
        ↓
Discovery call
        ↓
Demo
        ↓
Customer confirms pain
        ↓
Pilot proposal
        ↓
MSA + DPA + SOW
        ↓
Customer Azure/security review
        ↓
Deployment
        ↓
Configuration
        ↓
Data onboarding
        ↓
Training
        ↓
90-day pilot
        ↓
Pilot review
        ↓
Annual contract
        ↓
Ongoing ADORA usage
```

| Stage | What happens |
|-------|----------------|
| **Referral / outbound** | Message: operational ICT TPRM register + traceability for payment/EMI-scale firms — not “compliance in a box.” |
| **Discovery** | Qualify: DORA in scope, ~20–200 FTE, Excel pain, sponsor (TPRM + CISO/compliance), budget band, **customer Azure acceptable**. |
| **Demo** | Problem-led walkthrough (see §18); optional Nordhaven seed only for **demo**, not conflated with delivery. |
| **Pain confirmation** | Customer names critical vendor list, register gaps, upcoming assessment/audit pressure. |
| **Pilot proposal** | [`Azelos-First-Customer-Pilot-Package.md`](./Azelos-First-Customer-Pilot-Package.md): **€6–8k / 90 days**, hard scope limits, customer-hosted Azure. |
| **MSA + DPA + SOW** | Licence, liability, data processing, pilot scope/success criteria, out-of-scope list (§11 of pilot package). |
| **Azure/security review** | Customer reviews architecture: PG, Container App, KV, storage, firewall, backup ownership; Azelos may need time-boxed Contributor or customer-run Terraform. |
| **Deployment** | Terraform or Docker; bootstrap SUPER_ADMIN; `/ready`; secrets; CORS URL; image tag updates (Docker Hub workaround if ACR/Entra blocked). |
| **Configuration** | Provision tenant; ORG_ADMIN; profile; applicability/modules; invites (≤10 users). |
| **Data onboarding** | Joint: Azelos imports **bounded** rows; customer validates and enters remainder. |
| **Training** | 4 workshops: model, registers, map/reports, admin/export. |
| **90-day pilot** | Customer uses ADORA as system of record for in-scope ICT TPRM/resilience artefacts. |
| **Pilot review** | Success criteria §13; closure report; ZIP export; conversion discussion. |
| **Annual contract** | Subscription + support days; pilot fee credit if within 30 days. |
| **Ongoing usage** | Customer maintains data; Azelos ships upgrades and bounded support. |

---

## 5. First customer pilot (EU payment institution / EMI)

**Profile:** 20–200 employees; 1 entity; ≤10 users; 30–40 ICT providers; Excel/SharePoint today; goal = better ICT third-party risk management.

| Week | Activities |
|------|------------|
| **0** | Contracts signed; sponsor + TPRM lead named; security questionnaire started |
| **1** | Kickoff; scope limits signed; baseline metrics; Azure prerequisites |
| **2** | Deploy; bootstrap; provision tenant; ORG_ADMIN login; `/ready` |
| **3** | Profile + applicability/modules; import providers/contracts (split per SOW); invite users |
| **4** | Services, functions, dependencies; **relationship map** review |
| **5** | Risk assessments on critical providers; control statuses; first evidence batch |
| **6** | Requirements status pass; minimal BCP/DR/incidents as agreed |
| **7–8** | Customer-led use; office hours; P0/P1 fixes |
| **9** | Mid-pilot ZIP + CSV; gap list |
| **10–11** | JSON report + PDF assessment walkthrough; management dry-run |
| **12** | Closure report; final export; annual decision (30-day credit window) |

**Azelos effort cap:** 12 delivery days included in pilot fee. **Customer:** TPRM lead ~4 h/week in weeks 3–8; compliance/legal for applicability **decisions**; evidence files customer uploads.

---

## 6. How different users use ADORA (realistic)

Roles in product: there is **no `COMPLIANCE` role** — map compliance staff to **`USER`** or **`ORG_ADMIN`** as appropriate.

### ORG_ADMIN

- Complete **organization profile** and review **applicability**; toggle optional modules  
- **Invite users** (Team/Members); assign roles  
- Configure **integrations** (if used)  
- Run **tenant ZIP export** (API/procedure) for portability  
- Review **audit log**; settings (language, modules, custom fields where enabled)  
- **Weekly** during pilot: unblock users, validate data quality  

### ICT Risk / TPRM (`RISK_MANAGER` or power `USER`)

- **Weekly:** maintain **providers**, **contracts**, **services**; update statuses  
- Add/update **risk assessments**; review calculated levels  
- Update **contract control** compliance statuses  
- Attach **PDF evidence** on provider/contract/service/control rows where used  
- Use **relationship map** in provider reviews  
- **Monthly:** provider CSV export for committee pack (alongside PDF assessment if needed)  

### Compliance / DORA programme (`USER` / `ORG_ADMIN`)

- **Biweekly/monthly:** **requirements** list — applicability flags, implementation status, owners, notes  
- Track gaps (missing evidence called out in process + closure report, not magic automation)  
- Use **DORA overview** and **JSON reports** for programme reviews  
- Does **not** get legal conclusions from the tool  

### BCM / resilience (`BUSINESS_CONTINUITY_MANAGER`)

- **Monthly/quarterly:** update **BCP/DRP** records, **resilience tests**, **incidents** (as programme dictates)  
- Use **Resilience hub** and overview KPIs  
- Enter or review **findings/remediation** lists (UI basic — expect list maintenance, not full GRC workflow)  
- Link incidents/tests to providers/services where model supports it  

### Management (`AUDITOR` or read-focused access)

- **Monthly/quarterly:** **Dashboard**, **DORA overview**, **relationship map** in steerco  
- **DORA assessment PDF** or JSON report for snapshot  
- **AUDITOR:** read-oriented nav; exports may need ORG_ADMIN assistance for ZIP  

---

## 7. Concrete customer scenarios (supported workflows)

### Scenario 1 — New ICT provider

1. TPRM creates **provider** (or imports CSV).  
2. Creates **contract** linked to provider.  
3. Creates **ICT service** on contract; sets critical/important.  
4. Links service to **business function** via **Dependencies**.  
5. Optional: **risk assessment**; **control** rows appear from seed; status updated.  
6. **Relationship map** shows new chain.

### Scenario 2 — Contract review (missing DORA contractual information)

1. Open **contract** detail; review linked **services**.  
2. Open **Controls** — see seeded DORA-oriented controls per contract; set status to partial/missing.  
3. Upload **PDF evidence** (contract clause pack) on contract or control.  
4. Export **providers CSV** or **DORA assessment PDF** for committee “open items” list.

### Scenario 3 — High availability/security risk on provider

1. Open or create **risk assessment** scoped to provider/service.  
2. Enter dimension levels → system calculates level.  
3. Document rationale; link to **incident** if one exists.  
4. Trace **dependencies** on map: which **critical functions** depend on this service.  
5. Update **requirements** status if tied to risk treatment (manual process).

### Scenario 4 — Missing evidence for a control/requirement

1. Compliance filters **requirements** with “not implemented / in progress.”  
2. Control owner uploads **evidence** PDF on **control** or entity panel.  
3. Gap remains visible until status updated (requirement–evidence link UI limited — track gaps in pilot report).  
4. ORG_ADMIN runs **ZIP export** before audit for inventory.

### Scenario 5 — Resilience test finding

1. BCM records **resilience test** campaign.  
2. Enters **finding** in resilience list (API-backed list UI).  
3. Creates **remediation** item (list UI).  
4. Links **incident** if production impact occurred.  
5. Management views **DORA overview** / JSON report counts — not automated regulator notification.

---

## 8. Operational lifecycle in ADORA

```text
Identify → Assess → Treat → Implement controls → Collect evidence → Test → Findings → Corrective actions → Verify → Report
```

| Stage | ADORA support | Strength |
|-------|---------------|----------|
| **Identify** | Providers, services, functions, dependencies, assets | **Strong** |
| **Assess** | Risk assessments; requirement applicability | **Strong** (customer-owned judgement) |
| **Treat** | Status fields, notes, remediation lists | **Basic** (no workflow engine) |
| **Implement controls** | Contract DORA control statuses | **Operational, seeded catalogue** |
| **Collect evidence** | Upload + PDF attachments | **Strong** upload; **weak** requirement linking UI |
| **Test** | Resilience tests, BCP/DR registers | **Operational** |
| **Findings** | Resilience findings lists | **Basic UI** |
| **Corrective actions** | Remediation lists | **Basic UI** |
| **Verify** | Re-assess risk; update control/requirement status | **Manual** |
| **Report** | Dashboard, JSON, PDF assessment, CSV, ZIP | **Mixed** (no RoI product) |

**Strongest:** connected **identify + assess + map + export**. **Weakest:** treatment workflow automation, enterprise reporting packs, regulator artefacts.

---

## 9. Relationship graph value

**Question ADORA helps answer (when data is maintained):**

> “If this ICT provider fails, which services and critical business functions are affected, what risks exist, what controls protect them, and what evidence do we have?”

**Chain (as modeled):**

```text
Provider → Contract → ICT Service → Dependency → Critical Function → Risk → Control → Evidence
```

(Assets can sit alongside functions/services where modeled.)

**Why it beats disconnected registers:** Excel rows do not enforce **foreign keys** or **live traversal**. ADORA stores **relationships in one database** and renders them on the **relationship map** and GraphQL graph — so oversight meetings trace impact in minutes, not days of VLOOKUP. Value is **zero** if the customer only loads providers without contracts, services, and dependencies.

---

## 10. Usage frequency (honest)

| Cadence | Activity |
|---------|----------|
| **Daily** | Usually **nothing** for most users; TPRM might fix one provider/contract during onboarding-heavy weeks only |
| **Weekly** | TPRM: provider/contract/risk updates; ORG_ADMIN: user/access issues during pilot |
| **Monthly** | Requirements status; control reviews; CSV/PDF for internal meeting; map walkthrough |
| **Quarterly** | Resilience tests/BCP review; management dashboard; ZIP archive export |
| **Incident** | BCM/TPRM log **incident**; trace provider/service on map; update risk if needed |
| **Audit/assessment** | Compliance + ORG_ADMIN: requirements sweep, evidence push, JSON/PDF/ZIP exports |

---

## 11. Replace vs complement

| Existing tool/process | ADORA replaces? | ADORA complements? |
|----------------------|-----------------|---------------------|
| Excel ICT register | **Partially** (in-scope registers) | Yes — until migration complete |
| SharePoint evidence folders | **Partially** (metadata + PDF in app) | Yes — legal hold / raw doc store may stay |
| Email-based risk tracking | **Partially** for ICT TPRM register | Yes — email still used for negotiations |
| GRC platform | No | Yes — focused DORA ICT/resilience slice |
| Jira | No | Yes — remediation can stay in Jira; ADORA lists optional |
| SIEM | No | No operational ingestion |
| Document management | No | Yes — evidence attachments |
| Consulting/advisory | No | Yes — Azelos implements; customer/advisor interprets |
| Legal advice | No | No |
| External audit | No | Yes — exports for auditor review |

---

## 12. Buyer ROI (operational, not fake finance)

Measurable value:

- **Fewer spreadsheets** for the ICT third-party chain  
- **Faster retrieval** of “who supports what function” via map and linked detail pages  
- **Traceability** of changes (audit log) and ownership fields  
- **Fewer broken links** between provider, contract, service, function  
- **Easier evidence collection** on controls/entities (PDF)  
- **Clearer ownership** on requirements and controls  
- **Management reporting** from dashboard + PDF/JSON  
- **Dependency/concentration visibility** when sub-outsourcing and links maintained  
- **Faster assessment prep** via ZIP + PDF snapshot  

**Example KPIs (pilot success criteria):** % critical providers registered; % with contract; % contracts with service; % critical functions linked; % critical providers with risk assessment; count of requirements with evidence; map used in ≥1 management meeting; successful ZIP export.

---

## 13. Commercial model (recommended)

| Component | Price (EUR) | Pays for |
|-----------|-------------|----------|
| **Pilot (90 days)** | **€6,000–€8,000** | Licence, **12 delivery days**, workshops, support, closure report; readiness memo at €7k+ or +€2k |
| **Implementation** | **€8,000–€25,000** | Extra migration, SSO, networking, training beyond pilot |
| **Annual subscription** | **€9,600–€18,000+** | Software licence, upgrades, **~8 support days/year**, not unlimited consulting |

**Policy recommendations (assumptions to confirm in contract):**

| Question | Recommendation |
|----------|----------------|
| First customer discount? | **Yes, modest** (e.g. pilot at lower band + strong case study rights) — not free |
| Pilot fee credited to annual? | **Yes — 100%** if annual signed within **30 days** of pilot end |
| Implementation mandatory? | **Pilot includes bounded implementation**; larger migration = separate SOW |
| Customer Azure cost? | **Customer pays** Azure consumption always |
| In subscription? | Licence, upgrades, bounded support, security patches guidance |
| Charge separately? | Extra entities/users, SSO, heavy migration, readiness memo if not bundled, Phase 2 hardening |

---

## 14. Customer-hosted Azure (first customers)

```text
Customer Azure subscription
        ↓
ADORA infrastructure (RG: ACA, PG, KV, storage, monitoring)
        ↓
Customer PostgreSQL (all register data)
        ↓
Customer evidence bytes (local volume or blob)
```

| Topic | Owner |
|-------|--------|
| **Azure resources** | Customer |
| **Consumption billing** | Customer |
| **Deploy** | Customer engineer with Azelos runbook **or** Azelos with time-boxed access |
| **Updates** | New image tag + `terraform apply` / `az containerapp update`; Alembic on start |
| **Backups** | Customer configures PG backup/retention |
| **Secrets** | Customer KV / Container App secrets |
| **Support** | Azelos business hours; break-glass only if in SOW |
| **Azelos access** | Minimal; often no standing prod access |
| **Termination** | Final ZIP export; decommission per DPA; customer deletes subscription resources |

**Not offered yet:** Azelos-operated multi-tenant SaaS on Azelos subscription.

---

## 15. End of pilot handover

Customer receives:

- Running ADORA URL (customer Azure)  
- Configured tenant (profile, modules, users)  
- In-scope **customer data** in PostgreSQL  
- **CSV** (providers) + **ZIP** (tenant export) + **DORA assessment PDF**  
- **Pilot closure report** (Azelos PDF — services deliverable)  
- Optional **operational readiness memo** (disclaimer: not legal/compliance certification)  
- Customer docs (`docs/pilot/customer/*` export)

If they **do not** continue: keep ZIP; environment decommissioned per contract; no ongoing licence.

---

## 16. Annual customer lifecycle (why keep paying)

```text
Year 1 → continuous use → new providers/contracts → risk/evidence updates → testing/incidents → corrective actions → management reporting → annual review
```

**Recurring value:** ADORA is the **system of record** for the ICT/resilience graph. Registers **decay** without a maintained tool. Subscription pays for **continued licence**, **product updates** (migrations, fixes), and **bounded support** — not for one-time data entry. Leaving means reverting to fragmented tools while losing map, audit trail, and export consistency.

---

## 17. What ADORA must NOT be sold as

Do **not** claim: DORA certification; automatic compliance; regulatory approval; legal advice; regulator submission platform; full GRC replacement; validated EBA RoI product; unlimited consulting/migration/support.

**Correct positioning:** Operational workspace to **register, link, and oversee** ICT third-party and resilience information under **customer responsibility** for compliance outcomes.

---

## 18. Sales pitch

**One sentence:** ADORA gives payment and EMI firms one connected workspace to manage ICT providers, critical dependencies, risks, controls, and evidence — so oversight teams see the full picture instead of scattered spreadsheets.

**30 seconds:** You are under DORA pressure to know which ICT providers support critical functions, whether contracts and controls are in order, and where evidence lives. ADORA is a secure workspace that links providers, contracts, services, functions, risks, and evidence, with a relationship map and exports for your committees — implementation included for a 90-day pilot in **your** Azure.

**2 minutes:** Expand with pilot scope limits, customer-hosted data, roles (TPRM, compliance, BCM), what is out of scope (certification, RoI product, legal advice), pricing bands, and pilot-to-annual credit.

**Demo opening (problem-first):**  
“You have roughly forty ICT providers. Show me which ones support your critical functions, which contracts still have control gaps, which ICT risks are open, and what evidence backs your key requirements — without opening five Excel files.”  
Then: **Providers** → critical provider → **Contracts/Services** → **Dependencies** → **Relationship map** → **Risks/Controls** → **Requirements/Evidence** → **DORA overview** → **Export PDF/ZIP**.

---

## 19. Ideal first customer

**Target:** EU **payment institution or EMI** (or small investment firm), **20–200 FTE**, **Spain/France/Germany/Benelux/Ireland**, DORA in scope, **heavy SaaS/cloud**, registers in Excel/SharePoint, **sponsor** = Head of ICT risk/TPRM + CISO/compliance sign-off.

**Buyer:** TPRM lead influences; CISO/compliance approve; CFO/MD signs **€6–8k pilot** then **€10–18k/year**.

**Budget:** Low-medium vs enterprise GRC.

**Likely objections:** “We have consultants”; “Is this certified?”; “Security of Azure deploy”; “Our GRC vendor will add DORA”; “Excel is fine.”

**Do NOT target yet:** Large banks (long RFP), unlicensed fintechs, CTPPs seeking oversight tooling, firms demanding **Azelos-hosted SaaS**, **full RoI submission product**, or **SSO day-one** without implementation SOW.

---

## 20. Readiness verdict

| Gate | Verdict | Why |
|------|---------|-----|
| **Ready to test?** | **YES** | Core workflows implemented; demo seed; automated tests; Docker/Terraform paths exist |
| **Ready for paid pilot?** | **YES, with conditions** | Sell **customer-hosted Azure** pilot per package; complete **operational checklist** (one clean E2E deploy smoke, MSA/DPA/SOW, security one-pager, support channel) |
| **Ready for annual contract?** | **YES** (same ICP) | After successful pilot + honest scope; subscription = licence + updates + bounded support |
| **Ready as public SaaS?** | **NO** | [`SAAS-HOSTED-PRODUCT-REPORT.md`](../SAAS-HOSTED-PRODUCT-REPORT.md): hosted multi-tenant ops gate not passed |

**Blocking sales (operational, not feature):** legal templates, documented deploy smoke on customer-like Azure, support/runbook, set expectations on catalogue size, ZIP procedure, evidence-requirement UX gap.

---

## 21. Final model — “How ADORA Is Actually Sold and Used”

```text
WHO buys it
  → EU payment/EMI (20–200 FTE), TPRM/CISO/compliance sponsor, Excel-grade registers

WHY they buy it
  → One connected ICT third-party + resilience register; traceability; committee-ready exports; customer-controlled hosting

WHAT they buy
  → ADORA software licence + bounded implementation + pilot/annual support — not certification or unlimited consulting

HOW it is deployed
  → Customer Azure (Terraform/Docker), PostgreSQL, optional blob evidence; Azelos assists; not Azelos SaaS multi-tenant yet

HOW they are onboarded
  → MSA/DPA/SOW → deploy → provision → profile/applicability → partial import → training → 90-day pilot

HOW they use it
  → TPRM maintains chain; compliance tracks requirements; BCM maintains resilience lists; management uses map/dashboard/PDF/ZIP

WHAT value they get
  → Faster oversight, fewer broken links, evidence on controls, exportable snapshots, audit trail

WHAT they receive after 90 days
  → Running env, populated in-scope data, CSV/ZIP/PDF, closure report, optional readiness memo

WHY they continue paying
  → Ongoing system of record + updates/support; without it, registers fragment again
```

---

*When product ops gate or UX changes (SaaS ready, RoI export, evidence linking UI), update this document and the pilot package truth table in the same PR.*
