# DORA Supplier Risk Blueprint (`Azelos_DORA_BP`)

PostgreSQL source-of-truth for ICT third-party / supplier risk under DORA — **not** the APIO marketplace app in `maisonmaroc/`.

## Stack (this folder)

- PostgreSQL 16
- SQLAlchemy 2.x ORM
- Alembic migrations
- pytest integration tests

FastAPI, React, GraphQL, Azure, and Terraform are **out of scope** until the data model is stable.

## Quick start

```bash
# PostgreSQL (Docker — port 5433)
cd Azelos_DORA_BP
docker compose up -d

# Or local PostgreSQL on port 5432 — adjust DATABASE_URL
cp .env.example backend/.env

cd backend
pip install -e ".[dev]"
export DATABASE_URL=postgresql+psycopg://dora:dora@localhost:5433/dora_supplier_risk
alembic upgrade head
python3 scripts/seed_dev.py
pytest
```

## Migrations

| Revision | Purpose |
|----------|---------|
| `774dec1bcf90` | Core schema, constraints, indexes |
| `002_reference_data` | DORA control catalogue, document types, service classifications |

## Documentation

- [Phase 0 analysis](docs/PHASE0-ANALYSIS.md)
- [DORA RoI mapping strategy](docs/dora-roi-mapping.md)

## Entity relationship (Mermaid)

```mermaid
erDiagram
    FINANCIAL_ENTITIES ||--o{ ICT_PROVIDERS : owns
    FINANCIAL_ENTITIES ||--o{ CONTRACTS : owns
    FINANCIAL_ENTITIES ||--o{ BUSINESS_FUNCTIONS : owns
    FINANCIAL_ENTITIES ||--o{ RISK_ASSESSMENTS : scopes
    FINANCIAL_ENTITIES ||--o{ EVIDENCE : scopes
    FINANCIAL_ENTITIES ||--o{ EXIT_STRATEGIES : scopes

    ICT_PROVIDERS ||--o{ CONTRACTS : signs
    ICT_PROVIDERS ||--o{ SUBCONTRACTORS : chains
    ICT_PROVIDERS ||--o{ RISK_ASSESSMENTS : assessed
    ICT_PROVIDERS ||--o{ EVIDENCE : supports

    CONTRACTS ||--o{ ICT_SERVICES : delivers
    CONTRACTS ||--o{ CONTRACT_DORA_CONTROLS : governs
    CONTRACTS ||--o{ EVIDENCE : documents

    ICT_SERVICES ||--o{ FUNCTION_SERVICE_MAPPINGS : maps
    BUSINESS_FUNCTIONS ||--o{ FUNCTION_SERVICE_MAPPINGS : depends
    SERVICE_CLASSIFICATIONS ||--o{ ICT_SERVICES : classifies

    SUBCONTRACTORS ||--o{ SUBCONTRACTORS : parent

    DORA_CONTROL_DEFINITIONS ||--o{ CONTRACT_DORA_CONTROLS : defines
    EVIDENCE ||--o{ EVIDENCE_CONTROL_LINKS : proves
    CONTRACT_DORA_CONTROLS ||--o{ EVIDENCE_CONTROL_LINKS : linked

    BUSINESS_FUNCTIONS ||--o{ EXIT_STRATEGIES : requires
    ICT_SERVICES ||--o{ EXIT_STRATEGIES : targets
    CONTRACTS ||--o{ EXIT_STRATEGIES : contractual
    ICT_PROVIDERS ||--o{ EXIT_STRATEGIES : provider
```

## Index rationale (summary)

| Index | Why |
|-------|-----|
| `ix_ict_providers_lei`, `ix_ict_providers_legal_name` | Supplier lookup and deduplication |
| `ix_contracts_reference_number`, `ix_contracts_end_date` | Contract search and renewal/expiry jobs |
| `ix_ict_services_contract_id` | Service inventory per contract |
| `ix_business_functions_criticality` | C/I function reporting |
| `ix_subcontractors_provider_id`, `parent_id` | Recursive chain traversal |
| `ix_risk_assessments_provider_id`, `calculated_at` | Latest vs historical assessments |
| `ix_evidence_expiry_date` | Compliance monitoring |
| `ix_audit_records_entity` | Audit trail by business object |

## Assumptions

- Single deployment may start with one `financial_entities` row; schema still carries `financial_entity_id` everywhere for future RLS.
- LEI check is structural (20 alphanumeric); checksum validation can be added later.
- Risk scoring algorithm lives in application layer; DB stores inputs + version + outcome.
- `ai_suggested_status` on controls is never authoritative without human `approved_by`.

## Future extensions

- Row-Level Security policies on `financial_entity_id`
- FastAPI service + audit emitters on mutations
- Azure Blob Storage adapter for `evidence.blob_uri`
- RoI export service reading this schema
- GraphQL (Strawberry) read models
- Materialized views for concentration analytics (“functions depending on provider X”)
