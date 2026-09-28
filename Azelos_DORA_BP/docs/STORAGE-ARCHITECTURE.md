# Evidence storage architecture

## Principle

- **PostgreSQL** stores evidence **metadata** (provider, hash, dates, control links).
- **Object storage** holds file bytes (PDF, DOCX, etc.).

The application never assumes Azure Blob. Metadata uses provider-neutral fields:

| Column | Purpose |
|--------|---------|
| `storage_provider` | e.g. `local`, `azure_blob`, `s3`, `s3_compatible` |
| `storage_object_key` | Provider-specific object key/path |
| `content_hash` | SHA-256 (integrity) |
| `content_type` | MIME type |
| `size_bytes` | Object size |
| `metadata` | JSONB extras |

`blob_uri` is **deprecated** (nullable) for backward compatibility only.

## Interface

Business logic must depend on **`EvidenceStorage`** (`app/storage/base.py`), not a vendor SDK:

```text
DORA application / future services
        ↓
get_evidence_storage()  →  EvidenceStorage protocol
        ↓
Local / Azure Blob / S3 / MinIO
```

Implementations:

| Module | Status |
|--------|--------|
| `local.py` | Implemented (dev/tests) |
| `azure_blob.py` | Interface stub (no azure-sdk required) |
| `s3.py` | Interface stub |
| `s3_compatible.py` | Interface stub (MinIO-style) |

## Configuration

```env
STORAGE_PROVIDER=local
STORAGE_LOCAL_PATH=./storage
```

Future examples:

```env
STORAGE_PROVIDER=azure_blob
AZURE_STORAGE_ACCOUNT=
AZURE_STORAGE_CONTAINER=
```

```env
STORAGE_PROVIDER=s3
S3_BUCKET=
S3_REGION=
```

```env
STORAGE_PROVIDER=s3_compatible
S3_ENDPOINT=
S3_BUCKET=
```

Secrets stay in environment / secret store — never in source code.

## Anti-pattern

Do **not** call `azure_blob.upload(...)` from domain modules (`risk`, `contract`, etc.). Use `storage.upload(...)` via injected or factory-resolved `EvidenceStorage`.
