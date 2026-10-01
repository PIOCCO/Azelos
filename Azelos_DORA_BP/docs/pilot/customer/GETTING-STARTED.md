# Getting started (customer)

## Prerequisites

- Account email and password **or** invitation link from your administrator
- Modern browser (Chrome, Edge, Firefox, Safari — current versions)
- Network access to your organization’s Blueprint URL

Your organization must already exist (created by your platform operator or Azelos).

## Login

1. Open your Blueprint URL (e.g. `https://dora.yourbank.example` or `http://127.0.0.1:8000` in dev).
2. Go to **Login**.
3. Enter email and password.
4. If you belong to multiple organizations, select the correct one when prompted.

If you received an invitation, open **`/accept-invite`**, paste the token from the link, set a password (minimum 12 characters), and you will be signed in to onboarding.

## Initial configuration

After first login:

1. **Get started / Onboarding** — follow the wizard.
2. **Organization profile** — entity type, size, regulatory status (under onboarding or settings).
3. **DORA applicability** — review which modules apply (read-only; driven by your profile).

These steps define how dashboards and requirement lists apply to you.

## First data entry (recommended order)

1. **ICT providers** — legal name, country, identifiers as you use them internally.
2. **Contracts** — link each in-scope contract to a provider.
3. **ICT services** — link to contracts; set critical/important classification.
4. **Business functions** — mark critical/important functions.
5. **Dependencies** — link functions to services (and assets if you use them).
6. **Risk assessments** — at least for critical provider/service combinations.
7. **Requirements** — update implementation status for in-scope items.
8. **Evidence** — upload documents and link to requirements where applicable.

## Where things are in the UI

| Task | Navigation |
|------|------------|
| Overview KPIs | **Dashboard**, **DORA overview** |
| Third parties | **Providers**, **Contracts**, **ICT services** |
| Dependencies | **Dependencies**, **Relationship map** |
| Risks & evidence | **Risks**, **Evidence**, **Requirements** |
| Operations | **Incidents**, **Resilience** (tests, BCP/DR) |
| Exports | **Reports** and export actions on registers |

## Getting help

Use your pilot support contact. For audit history of changes, administrators can open **Audit log** (role permitting).
