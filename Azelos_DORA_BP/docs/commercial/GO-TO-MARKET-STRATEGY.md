# Azelos DORA BP — Go-to-market & monetization strategy

**Status:** Working commercial plan (facts vs assumptions labeled)  
**Date:** October 2026  
**Scope:** Sell what exists today (`Azelos_DORA_BP` V1 operational workspace). No product redesign in this document.

---

## 1. Product understanding (facts)

**What Azelos DORA BP is**

A **multi-tenant operational workspace** for EU financial entities to **register, link, and oversee** DORA-relevant ICT third-party arrangements, resilience artefacts, risks, requirements, evidence, and incidents—and to **visualize dependencies**, **review KPIs**, and **export oversight data**.

**Positioning (mandatory)**

- **Do:** “Operationalize DORA ICT resilience and third-party risk management.”
- **Do not:** “Certify DORA compliance,” “become compliant by buying Azelos,” or imply regulator approval.

**Workflow coverage (as implemented)**

Organization → Applicability (rules-driven, review UI) → Requirements → Business functions → BIA → Information/ICT assets → Dependencies → ICT services → ICT providers → Contracts → Controls → ICT risk → Evidence → Incidents → BCP/DR → Resilience testing → Findings/remediation (API-heavy UI) → Reporting (JSON).

**Strengths (evidence from codebase/docs)**

- End-to-end **object graph**: provider ↔ contract ↔ service ↔ function ↔ asset ↔ risk, plus **relationship map** (GraphQL).
- **Tenant isolation**, RBAC, audit log, provisioning, trial subscription model (operator-side).
- **Risk calculation** server-side; requirement baseline copied per org at provision.
- **Exports**: provider CSV, tenant ZIP (API), multiple JSON report types.
- **Deployment flexibility**: customer-hosted PostgreSQL + container; optional Azure Terraform path.
- EN/FR UI.

**Commercial weaknesses (honest)**

- Internal assessment: **not yet “customer SaaS pilot ready”** on hosted Azure without operator runbook (connectivity, HTTPS smoke, multi-tenant hosted ops).
- **Small seeded regulatory catalogue** (pilot baseline—not full RTS/article library out of the box).
- **No regulator-ready Register of Information pack** as a marketed, validated EBA 15-table export product (reports exist; maturity varies).
- **No PDF report UX**; resilience sub-modules partly **list-only** in UI.
- **OIDC** env-level, not self-service; rate limiting in-memory (single-instance caveat).
- **No marketplace billing**, no automated vendor due diligence, no NCA incident submission connector.

**Assumption:** Buyers will accept “operational register + traceability” if implementation is hands-on and price is below enterprise GRC.

---

## 2. Ideal customer & beachhead (recommendation)

### Segments (summary)

| Segment | Size | DORA pain | Budget | Sales difficulty | Competitors | Buy willingness |
|--------|------|-----------|--------|------------------|-------------|-----------------|
| Significant credit institutions / large banks | 1,000+ FTE | Extreme | High | Very high (12–24 mo) | ServiceNow, MetricStream, OneTrust, Big4 | High but gatekept |
| Regional banks / insurers | 200–2,000 FTE | High | Medium–high | High | Acuna, LogicGate, Resolver, consultancies | Medium |
| **Payment institutions / EMIs / small investment firms** | **20–250 FTE** | **High (TPRM + registers)** | **Low–medium** | **Medium** | **DORAedge, Venvera, spreadsheets, local consultancies** | **High if priced & implemented fast** |
| FinTech (licensed) | 50–500 FTE | Medium–high | Medium | Medium | Same as above + build vs buy | Medium |
| ICT CTPPs | N/A | Different problem (oversight target) | N/A | Wrong ICP | Oversight/regtech | Low fit for entity register product |

### Beachhead (recommendation)

**Primary:** **EU payment institutions and EMIs (and small investment firms)** in **Spain, France, Germany, Benelux, Ireland** with **~20–200 employees**, already subject to DORA, with **heavy cloud/SaaS ICT dependency** and **immature register of information** (often Excel/SharePoint).

**Why not “banks” generically:** Large banks will RFP against entrenched GRC; sales cycles kill a startup. Payment/EMI firms feel DORA TPRM pressure, have fewer procurement layers, and cannot justify €100k+ GRC suites.

**Secondary beachhead (channel):** **Boutique DORA/resilience consultancies (5–50 people)** serving the same EMI/payment segment—they need a **client workspace**, not another certification logo.

**Facts:** DORA ICT third-party obligations include strategy, due diligence, contractual provisions, register of information, and subcontractor visibility ([RTS on ICT third-party risk policy](https://ec.europa.eu/finance/docs/level-2-measures/dora-regulation-rts--2024-1531_en.pdf)). Financial entities remain responsible; CTPP oversight is separate ([EIOPA DORA oversight](https://www.eiopa.europa.eu/digital-operational-resilience-act-dora/dora-oversight_en)).

---

## 3. Buyer map (recommendation)

| Role | Feels pain? | Uses product? | Budget? | Signs? | Can block? |
|------|-------------|---------------|---------|--------|------------|
| **Head of ICT risk / TPRM** | **Yes** | **Yes** | Influences | Sometimes | Yes (technical) |
| DORA programme manager | Yes | Yes | Influences | Rarely | Coordination |
| **CISO** | Yes | Oversight | **Often approves** | Sometimes | **Yes** |
| Compliance officer | Yes | Requirements/evidence | Influences | Sometimes | Yes (procurement) |
| BCM manager | Yes | BCP/DR/tests | Low | Rarely | Functional |
| CIO | Medium | Indirect | Approves capex | Sometimes | Yes |
| Internal audit | Medium | Read/export | No | No | **Yes (must trust audit trail)** |
| CFO | Low | No | **Final sign** on spend | **Yes** | **Yes (ROI)** |

**Recommendation**

1. **Pain:** ICT risk / TPRM lead + DORA programme lead.  
2. **Users:** TPRM analysts, BCM, compliance analysts, control owners.  
3. **Approve:** CISO or COO + compliance head.  
4. **Sign:** CFO or MD (EMI) / delegated authority.  
5. **Block:** IT security (hosting/data residency), audit (evidence integrity), existing GRC vendor, Big4 “we already have a project.”

**Entry message:** Lead with **ICT third-party register + traceability**; expand to resilience testing and incidents once engaged.

---

## 4. Commercial offer (recommended bundle)

Sell a **bundle**, not “software only.”

| Component | Sell? | Rationale |
|-----------|-------|-----------|
| **A. SaaS subscription** (hosted by Azelos) | **Yes (after hosted ops hardened)** or **customer-hosted sub** | Recurring revenue |
| **B. Implementation package** | **Yes (required)** | Product needs data model + registers populated; founder strength |
| **C. DORA readiness assessment (fixed scope)** | **Yes** | Foot in door; not certification |
| **D. Continuous operations retainer** | **Later (Year 2)** | After 5+ customers; avoid becoming a consultancy-only firm early |
| **E. Independent assessment partnership** | **Yes (channel)** | Auditors/consultants bring deals; Azelos stays platform |
| **F. Enterprise / private deployment** | **Yes (selective)** | EMIs with “data must stay in our Azure/subscription” |

**Recommended Year-1 SKU**

**“Azelos DORA Operations Workspace”**

- Subscription (hosted or customer cloud)  
- **Mandatory** implementation (4–8 weeks)  
- Optional **Readiness & Register Gap Review** (2–3 weeks, fixed fee)  
- **No certification** included  

---

## 5. Certificate question (legal/commercial caution)

**Facts**

- DORA **supervision** is by **competent authorities**; entity compliance is not granted by a software vendor.  
- **CTPP oversight** is an ESA-led regime for critical ICT providers—not something Azelos sells to entities as a “certificate.”

**Azelos may legitimately provide**

- Software to **maintain registers and evidence**  
- **Readiness assessment** (current state vs agreed scope of obligations **as interpreted by the customer and their advisors**)  
- **Gap / remediation backlog** and operational KPIs  
- Export packs for **customer’s** audit/supervisory preparation (with disclaimers)

**Independent assessors/auditors should provide**

- Audit opinions, regulatory assurance, control testing independence, sign-off for external stakeholders

**Recommendation**

- **Do not sell a “DORA certificate.”**  
- **Do sell:** “DORA **operational readiness** review” + “**register & evidence maturity** report” with explicit **non-reliance / no legal advice** terms.  
- **Do partner** with consultancies/audit firms: they lead assessment; Azelos is system of record—**stronger and safer** than Azelos pretending to be an auditor.

---

## 6. Pricing strategy (EUR primary; USD ≈ parity ±5%)

**Pricing philosophy:** Undercut enterprise GRC; **at or above** micro-SaaS (DORAedge) on value when implementation included; price on **organization + implementation**, not per-seat initially (simpler for EMIs).

### Published comparators (facts where cited)

- **DORAedge:** €2,999/year (1 seat, microenterprise) / €6,996/year (5 seats) — [doraedge.com/pricing](https://www.doraedge.com/pricing)  
- **Venvera:** from **€399/month** (1 framework) — [venvera.com comparison](https://venvera.com/best/saas-platforms-for-dora-compliance-in-2026)  
- **Market ranges (third-party blog, use as directional only):** ~€5k–20k/year smaller FIs; €30k–100k regional — [Legiscope buyers guide](https://www.legiscope.com/blog/dora-compliance-software-buyers-guide.html)  
- **LogicGate / Resolver (Vendorica comparison table):** ~€3k–4k/month starting claims — [vendorica.com/best](https://vendorica.com/best/) — **treat as marketing comparison, not verified list prices**

### Azelos recommended pricing (assumptions)

| Tier | Profile | Annual subscription (EUR) | USD | Implementation (one-time) | Notes |
|------|---------|----------------------------|-----|---------------------------|--------|
| **Starter** | EMI/payment **≤100 FTE**, 1 entity | **€9,600** (€800/mo) | **$10,500** | **€8,000–12,000** | Up to 15 users included |
| **Growth** | **100–250 FTE**, 1–2 entities | **€18,000** (€1,500/mo) | **$19,500** | **€15,000–25,000** | Up to 40 users |
| **Enterprise** | **250+ FTE** or complex group | **€42,000–72,000** | **$46k–78k** | **€35,000+** (SOW) | Private deploy, SSO, SLA |

**Add-ons (assumptions)**

- Extra entity (consolidated sub): **€3,600/year**  
- Extra 10 users: **€1,200/year**  
- Private Azure deployment setup: **€12,000–20,000** one-time (customer subscription)  
- Data migration (from Excel): **€4,000–15,000** by row complexity  
- Readiness & register gap review: **€6,000–12,000** fixed  
- Premium support (next-business-day): **+20%** subscription  

**Why realistic:** Cheaper than Big4 annual register maintenance and enterprise GRC; **more than** single-seat DORAedge because Azelos sells **implementation + graph workspace**, not only software self-serve.

**Alternatives customers compare to**

- Excel/SharePoint: €0 software, **0.5–2 FTE** (Legiscope cites similar range for manual maintenance)  
- Consultancy-led register: **€50k–200k** project year one  
- Enterprise GRC: **€30k–250k+/year** (Legiscope/Vendorica ranges—directional)

---

## 7. Competitor analysis (selected)

| Competitor | Positioning | Target | Strength | Weakness vs Azelos | Public pricing |
|------------|-------------|--------|----------|---------------------|----------------|
| **DORAedge (Performativ)** | DORA ops, RoI generation, AI assistant | Micro/small entities | Clear DORA feature list, low entry € | Less depth on custom graph/implementation narrative | **€2,999–6,996/year** ([pricing](https://www.doraedge.com/pricing)) |
| **Venvera** | Multi-framework compliance (DORA + ISO/NIS2…) | Mid-market | Transparent pricing, evidence reuse | Not DORA-depth-first story | **From €399/mo** ([Venvera](https://venvera.com/best/saas-platforms-for-dora-compliance-in-2026)) |
| **Vendorica** | DORA-native + TPRM + incident claims | EU FIs | Strong marketing on RoI/NCA flows | Verify claims independently; startup noise in “best of” lists | “Free” tier claimed on vendor site—validate scope |
| **Acuna** | Multi-framework GRC, DORA module | EU CH/EU entities | Mature practitioner brand, Swiss/EU hosting story | Heavier platform sale | **Quote-based** ([Acuna DORA](https://acunagrc.com/en/solutions/dora)) |
| **OneTrust / ServiceNow GRC** | Enterprise GRC | Large FIs | Procurement-approved vendors | Cost, time, DORA=configuration project | **Quote-based** |
| **Big4 / niche consultancies** | People-led DORA programmes | All | Trust, relationships | No live register at scale, vendor lock-in to decks | Day rates **€1,500–3,000+** |

**Do not invent** ServiceNow/OneTrust list prices in contracts; always quote after discovery.

---

## 8. Differentiators (1–3, evidence-based)

1. **Linked operational DORA chain in one tenant** — provider → contract → service → function → asset → risk → requirement/evidence, with **relationship map** (implemented; not a generic GRC workflow designer project).  
2. **Implementation-led time-to-register** — founder-led deployment to a **working register in weeks**, aimed at EMIs that will not survive a 9-month GRC rollout (assumption backed by product focus and pilot definition).  
3. **Deploy where the customer needs it** — container + PostgreSQL; **customer subscription or Azelos-hosted** (Azure IaC exists); appeals to EMIs with residency concerns without €250k GRC (fact: deployment model; assumption: buyer value).

**Not differentiators today:** “AI-powered,” “full GRC,” “regulator submission out of the box,” “certification.”

---

## 9. Sales process

```
Lead → Qualify → Discovery → Maturity snapshot → Demo (scoped) → Paid pilot → Implementation → Annual subscription → Expand (entities/modules/users)
```

| Stage | Goal | Duration | Output |
|-------|------|----------|--------|
| Lead | ICP fit | Ongoing | Meeting booked |
| Qualify | EMI/payment, DORA in scope, budget band | 30 min call | Go/no-go |
| Discovery | Pain, current tools, target date (audit/supervisory) | 60–90 min | Notes + stakeholder map |
| Maturity snapshot | **Light** register maturity (not full audit) | 1–2 weeks | 5–10 page **readiness memo** (paid or pilot credit) |
| Demo | Show **their** workflow: provider→contract→risk→evidence→map | 45 min | Technical win with TPRM |
| Paid pilot | 1 entity, limited users, defined registers | **90 days** | Working register + export |
| Implementation | Production + SSO/storage decision | 4–8 weeks | Go-live checklist |
| Subscription | ARR | Annual | Renewal + upsell entities |

**Lead sources:** LinkedIn outbound to TPRM/CISO at EMIs; DORA webinars with consultancies; cloud partner intro (Azure marketplace later); regulator/industry association events (Spain AEPD/Banco de España ecosystem, ACPR/FBF networks, BaFin forums—**assumption: network dependent**).

**First meeting must achieve:** Confirm **ICT register pain**, decision timeline, and **who signs**—not a feature tour.

**Pilot success metrics:** ≥X providers/contracts loaded (e.g. 80% of critical ICT vendors), ≥1 risk cycle documented, evidence linked to ≥N controls/requirements, relationship map used in internal meeting, export generated for audit committee.

**Conversion:** Pilot fee **credited 50–100%** to Year-1 subscription if signed within 30 days of pilot end.

---

## 10. First 10 customers (realistic playbook)

**Constraints:** No brand, no sales team, technical founder, working V1, hands-on implementation.

| # | Tactic | Action |
|---|--------|--------|
| 1 | **Founder outbound** | 50 targeted LinkedIn messages/week to **Head of ICT Risk / Compliance** at EMIs/payment firms in ES/FR/DE |
| 2 | **Consultancy partners (3 firms)** | Offer **30% first-year rev share** or white-label workspace for their EMI clients |
| 3 | **Paid readiness workshop** | €2k half-day + checklist; credit toward pilot |
| 4 | **Pilot slots (limited)** | “Q1 2027: 5 pilot slots” scarcity |
| 5 | **Customer-hosted first** | Avoid blocked Azelos-hosted Azure until ops hardened—sell **“runs in your Azure/subscription”** |
| 6 | **Case study trade** | 30% discount for logo + reference call |
| 7 | **Industry Slack/communities** | Payment/FinTech compliance groups |
| 8 | **Big4 alternative positioning** | “System of record after the Big4 design phase” — don’t fight programme owners |
| 9 | **Spanish/French local language** | Use FR/EN UI as wedge in ES/FR mid-market |
| 10 | **Founder-led demo only** | No SDR theater; deep demos for qualified leads only |

**Goal:** 10 paying customers = **~6–8 pilots started**, **~50% conversion**, **~12–18 month founder sales effort** (assumption).

---

## 11. Sales messages

### One sentence
Azelos gives payment and investment firms one operational workspace to run DORA ICT third-party registers, risks, evidence, and resilience data—with clear traceability from provider to critical function.

### 30 seconds
You’re under DORA pressure to maintain a living register of ICT providers, contracts, and dependencies—not a slide deck. Azelos is an operational workspace that links providers, services, contracts, functions, assets, and risks, stores evidence, and gives your CISO and auditors a consistent export. We implement it with you in weeks. We don’t certify you; we make the ongoing work manageable.

### 2 minutes
(FExpand 30s with: workflow list, relationship map, dashboards, JSON reports/exports, deployment choice, implementation package, pilot path.)

### Discovery opening
“We’re not here to sell compliance in a box. I want to understand how you maintain your ICT third-party register today, what your supervisor or auditors asked for last, and whether a linked operational workspace would reduce friction before your next review.”

### Demo opening
“I’ll show how one critical provider flows through contract, service, business function, risk assessment, and evidence—so you can see traceability in one place.”

### Pain
“Registers live in Excel; nobody trusts the link between contracts, subprocessors, and critical functions; every audit is a reconstruction project.”

### ROI
“Reduce reconstruction time before audits/supervisory questions; keep one authoritative register; avoid a second enterprise GRC programme.”

### Objections

| Objection | Response |
|-----------|----------|
| Why not Excel? | Excel doesn’t enforce links, versioning, or audit trail; cost is hidden FTE and error risk before every review. |
| We have GRC | Keep it for enterprise policy; Azelos is the **DORA ICT operational register** that can feed GRC exports. |
| Consulting firm handles DORA | They deliver programmes; you still need a **system of record** when they leave. |
| We already have a DORA project | Good—Azelos **implements** the register phase; we don’t replace programme management. |
| Only need this for audit | Audits repeat; operational tooling amortizes; pilot proves value before audit season. |
| Why trust a startup? | Customer-hosted deployment option, exports you own, no lock-in of evidence bytes; start with pilot SOW. |
| Does Azelos certify us? | **No.** We provide software and optional readiness reviews; your management and auditors/regulators assess compliance. |

---

## 12. Pilot design (first customer template)

| Item | Recommendation |
|------|----------------|
| Duration | **90 days** |
| Price | **€6,000–8,000** (or 50% credited to Year 1) |
| Scope | 1 legal entity, ≤10 users, modules: TPRM + risk + requirements + evidence |
| Customer provides | Top 30–50 ICT providers list, sample contracts, critical function list, 2–3 risk owners |
| Azelos configures | Tenant, profile/applicability review, module toggles, import templates |
| Workflows tested | Provider→contract→service→dependency→risk→evidence; map + one JSON report |
| Deliverables | Loaded register, **pilot closure report** (coverage %, gaps, backlog), export bundle |
| Success criteria | ≥80% critical vendors in system; ≥5 evidence-linked controls; internal steering uses map/report |
| Conversion | Signed annual + implementation SOW within 30 days; else export + read-only archive policy |

**Avoid fully free pilot** except strategic lighthouse with written case study + reference obligations.

---

## 13. Revenue model — Year 1 (Oct 2026 – Sep 2027)

**Assumptions:** Founder-led sales; hosted SaaS or customer-deploy; average prices mid Starter/Growth band.

| Scenario | Paying customers (end Y1) | Avg ACV (sub) | Implementation rev | Assessment rev | **Total Y1 revenue** |
|----------|---------------------------|---------------|--------------------|----------------|----------------------|
| **Conservative** | 3 | €10k | €30k (€10k×3) | €12k | **€72k** |
| **Base** | 7 | €14k | €84k (€12k×7) | €30k | **€212k** |
| **Aggressive** | 12 | €16k | €180k (€15k×12) | €60k | **€432k** |

**Facts:** None of the above is contracted revenue—**forecast only**.

**Cost reminder (assumption):** Founder time dominates; infra cost low per customer if customer-hosted.

---

## 14. Founder strategy

**Founder should personally own (until ~€300k ARR):**

- Discovery and demo (all deals)  
- Pilot SOWs and success criteria  
- Implementation architecture (DB, deploy, migrations)  
- First 3 customer references  
- Partnership conversations with consultancies  

**Hire/outsource first:**

- Legal MSAs/DPA review (counsel)  
- Bookkeeping/contracts admin  
- Later: AE with FI/regulatory literacy (after repeatable pitch)  

**Deprioritize early:** Paid ads, broad content SEO, enterprise RFP desk, building certification brand.

---

## 15. Final recommendation (brutally honest)

| # | Question | Answer |
|---|----------|--------|
| 1 | Sellable today? | **Conditionally yes** — **customer-hosted / private deploy** with founder implementation; **Azelos-hosted multi-tenant SaaS** only after ops/security checklist closed (internal doc says not ready). |
| 2 | Sell to first? | **EU payment institutions & EMIs (20–200 FTE)**, ES/FR/DE focus; channel via **boutique DORA consultancies**. |
| 3 | What to sell? | **Subscription + mandatory implementation**; optional **readiness/register gap review**; **no certificate**. |
| 4 | What to charge? | **€9.6k–18k/year** + **€8k–25k implement** for beachhead; pilots **€6k–8k**. |
| 5 | Sell certification? | **No.** |
| 6 | Sell assessments? | **Yes**, fixed-scope **readiness/register maturity** only, with legal disclaimers. |
| 7 | Partner auditors/consultancies? | **Yes — primary channel strategy.** |
| 8 | Strongest differentiator? | **Linked DORA ICT operational graph + fast implementation**, not “compliance in a box.” |
| 9 | First 10 customers? | Founder outbound + 3 consultancy partners + paid pilots + customer-hosted deploy. |
| 10 | Biggest commercial risk? | **Trust gap (startup)** + **product gaps vs RoI/regulator export expectations** + **long GRC replacement cycles** if you target wrong ICP. |
| 11 | What NOT to do? | Don’t claim certification; don’t chase tier-1 banks Year 1; don’t sell hosted SaaS without ops; don’t compete on “AI”; don’t underprice implementation to zero; don’t market full GRC parity. |

---

## Sources (external)

- DORA ICT third-party RTS (EU): https://ec.europa.eu/finance/docs/level-2-measures/dora-regulation-rts--2024-1531_en.pdf  
- EIOPA DORA oversight: https://www.eiopa.europa.eu/digital-operational-resilience-act-dora/dora-oversight_en  
- DORAedge pricing: https://www.doraedge.com/pricing  
- Venvera 2026 comparison (pricing): https://venvera.com/best/saas-platforms-for-dora-compliance-in-2026  
- Legiscope buyers guide (ranges—directional): https://www.legiscope.com/blog/dora-compliance-software-buyers-guide.html  
- Acuna DORA positioning: https://acunagrc.com/en/solutions/dora  

## Internal sources (product facts)

- `docs/pilot/PILOT-PRODUCT-DEFINITION.md`  
- `docs/customer-product-validation.md`  
- `docs/SAAS-HOSTED-PRODUCT-REPORT.md`  
