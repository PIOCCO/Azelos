import hashlib
import sys
from pathlib import Path

from sqlalchemy import update
from sqlalchemy.orm import Session

from app.embeddings.provider import embed_texts
from app.models.entities import Document, DocumentChunk, DocumentVersion, ProcessingStatus
from app.services.extraction import extract_text
from app.services.storage import put_object

# repo root for rag chunking
ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
from rag.chunking import chunk_pages  # noqa: E402


def process_document(db: Session, document_id: str) -> None:
    doc = db.get(Document, document_id)
    if not doc:
        return
    version = (
        db.query(DocumentVersion)
        .filter(DocumentVersion.document_id == document_id, DocumentVersion.is_active.is_(True))
        .order_by(DocumentVersion.version.desc())
        .first()
    )
    if not version:
        doc.processing_status = ProcessingStatus.FAILED
        doc.processing_error = "No active version"
        db.commit()
        return

    try:
        doc.processing_status = ProcessingStatus.PROCESSING
        db.commit()

        from app.services.storage import get_object

        raw = get_object(version.storage_key)
        pages = extract_text(doc.filename, raw)
        doc.processing_status = ProcessingStatus.INDEXING
        db.commit()

        # deactivate old chunks for document
        db.execute(update(DocumentChunk).where(DocumentChunk.document_id == document_id).values(is_active=False))

        chunks = chunk_pages(pages)
        texts = [c["content"] for c in chunks]
        vectors = embed_texts(texts)

        for c, vec in zip(chunks, vectors):
            db.add(
                DocumentChunk(
                    tenant_id=doc.tenant_id,
                    document_id=doc.id,
                    version_id=version.id,
                    chunk_index=c["chunk_index"],
                    page=c.get("page"),
                    section=c.get("section"),
                    content=c["content"],
                    embedding=vec,
                    is_active=True,
                )
            )

        doc.processing_status = ProcessingStatus.INDEXED
        doc.processing_error = None
        db.commit()
    except Exception as exc:  # noqa: BLE001
        doc.processing_status = ProcessingStatus.FAILED
        doc.processing_error = str(exc)[:2000]
        db.commit()
        raise


def create_upload_version(
    db: Session,
    doc: Document,
    file_bytes: bytes,
    storage_key: str,
) -> DocumentVersion:
    checksum = hashlib.sha256(file_bytes).hexdigest()
    # deactivate prior versions' chunks handled on reindex; mark old versions inactive
    db.execute(update(DocumentVersion).where(DocumentVersion.document_id == doc.id).values(is_active=False))
    version = DocumentVersion(
        document_id=doc.id,
        version=doc.active_version,
        checksum=checksum,
        storage_key=storage_key,
        is_active=True,
    )
    db.add(version)
    put_object(storage_key, file_bytes, doc.mime_type)
    db.commit()
    return version
