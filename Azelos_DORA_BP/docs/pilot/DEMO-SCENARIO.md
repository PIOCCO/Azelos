# Pilot demonstration scenario

**Tenant:** Nordhaven Mutual Bank AG (Pilot Demo) — **fictional** data only.  
**Seed:** `python scripts/seed_pilot_demo.py` (pilot/demo databases).  
**Login:** `pilot.admin@pilot-demo.example` / `PilotDemoAdmin12!` — rotate in any shared environment.

## Story

Nordhaven depends on **PaymentClear EU B.V.** for **retail SEPA payment switching**, a **critical** business function. The demo shows the full chain from third party to evidence and oversight views.

## Data loaded (high level)

- 3 ICT providers (PaymentClear, SecureAuth, Nimbus Cloud)
- 3 active contracts and classified ICT services
- Critical functions: **Retail SEPA Payments**, **Digital Banking Channel**
- ICT asset **PaymentClear processing cluster** linked to payments function
- High risk assessment on PaymentClear / payment service
- Organization requirement (sample) **in progress** with linked evidence file
- Fictional incident (latency) linked to payment service
- BCP, DRP, and completed resilience tabletop test
- Subcontractor/concentration data is **not** the focus of this seed (can be added live in UI)

## Live walkthrough (use the product UI)

1. **Login** as pilot admin.
2. **Dashboard** — note provider and risk counts reflect seeded data.
3. **Providers** → open **PaymentClear EU B.V.** — contract and risk context on detail/relationship panels.
4. **Contracts** → `NH-ICT-2024-PAY-001` — linked provider and services.
5. **ICT services** → **Retail SEPA Payment Switching** — critical classification, link to dependencies.
6. **Business functions** → **Retail SEPA Payments** — linked services/assets.
7. **ICT assets** → **PaymentClear processing cluster**.
8. **Risks** → assessment on PaymentClear (high / very high dimensions).
9. **Requirements** — at least one row **in progress** with evidence link.
10. **Evidence** — download `paymentclear-soc2-demo.txt` (proves storage + metadata).
11. **Incidents** — fictional latency incident linked to payment service.
12. **Resilience** hub — BCP, DRP, resilience test campaign.
13. **DORA overview** (`/dora/overview`) — KPIs from live counts.
14. **Relationship map** (`/dora/relationship-map`) — expand from PaymentClear / payment service; pan/zoom; optional node drag (session-only positions).
15. **Reports** — generate DORA assessment / resilience report available in UI.
16. **Exports** — ICT providers **CSV** from Providers page; **tenant ZIP** via API (`GET /api/v1/tenant/data/export`) if operator demo requires full export.

## What to say (and not say)

- **Do say:** operational register, traceability, oversight reporting from customer-maintained data.
- **Do not say:** “certified for DORA,” “regulator-ready submission,” or “automated compliance.”

## Provisioned customer vs demo tenant

| | Demo tenant (seed) | Real pilot customer |
|--|-------------------|---------------------|
| Creation | `seed_pilot_demo.py` | `tenant/provision` + ORG_ADMIN |
| Data | Fictional | Customer-entered |
| Coexistence | Separate `financial_entity` row | Isolated by tenant ID |

Demo data lives only in PostgreSQL rows for the pilot org; **no demo values are hardcoded in application logic**.
