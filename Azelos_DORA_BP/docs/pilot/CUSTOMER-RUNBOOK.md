# Customer pilot runbook

Task-oriented steps for **ORG_ADMIN and users** during the pilot. Not a DORA regulation tutorial.

## Prerequisites

- URL, email, and password (or invitation link) from your operator
- Browser (current Chrome, Edge, Firefox, or Safari)
- Internal agreement on who owns data entry (providers, risks, evidence)

## Login

1. Open your Blueprint URL → **Login**.
2. Enter email and password; select your organization if asked.

**Invitation path:** open `/accept-invite`, paste token from link, set password (≥12 characters).

## Initial setup

1. **Get started / Onboarding** — complete **organization profile** (entity type, size, regulatory status).
2. Open **Applicability** — **review** modules and flags (read-only; updates when profile changes).
3. **Team members** — invite colleagues and assign roles.

## First provider

1. **Providers** → create provider (legal name, country, identifiers you use).
2. Open provider detail to confirm it saved.

## First contract

1. **Contracts** → new contract → select provider, reference number, dates, status.

## First ICT service

1. **ICT services** → link to contract, name service, set classification and critical/important.

## First critical function

1. **Business functions** → create function, mark critical/important if applicable.

## Link function to service

1. **Dependencies** → map business function to ICT service(s).

## First asset

1. **ICT assets** → create asset; link to function on asset/function mapping if shown.

## First risk

1. **Risks** → new assessment linked to provider/contract/service; enter dimensions and rationale.

## First requirement

1. **Regulatory requirements** → organization table → set **implementation status** (and applicable flag if shown).

## First evidence

1. **Evidence** → choose document type → upload file → download to confirm.

**Note:** Linking evidence to a specific requirement in the UI is **not** available in this release; status tracking on requirements is. Ask operator if API export/linking is needed for pilot.

## First incident / test

1. **Incidents** → record incident (title, severity, status).
2. **Resilience** → **Resilience tests**, **Business continuity**, **Disaster recovery** as your programme requires.

## Relationship map

1. **DORA → Relationship map** — explore provider → service → function chain; pan/zoom; drag nodes (layout resets on full reset/new session).

## Dashboard

1. **Dashboard** and **DORA overview** — confirm counts change when you add data.

## Report

1. **Reports** → run e.g. **DORA Assessment Report** — JSON summary displayed (not PDF).

## Export

1. **Providers** → **Export CSV** (where shown on page).
2. Full tenant ZIP: request operator or use authorized API `GET /api/v1/tenant/data/export` if provided.

## Support

Use the channel agreed in your pilot agreement. For change history, **Audit log** (admin roles).
