import hashlib
import uuid
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext, get_auth_context, require_role
from app.core.exceptions import AppError
from app.core.rbac import Role
from app.models.enums import AuditAction
from app.models.evidence import DocumentType, Evidence
from app.repositories.evidence import EvidenceRepository
from app.schemas.common import PaginatedResponse
from app.schemas.evidence import EvidenceOut
from app.services.platform_audit import record_platform_audit
from app.storage.factory import get_evidence_storage

router = APIRouter(prefix="/evidence", tags=["Evidence"])


@router.get("", response_model=PaginatedResponse, summary="Evidence metadata only")
def list_evidence(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    repo = EvidenceRepository(db, ctx.organization_id)
    items, total = repo.list_paginated(page, page_size)
    return PaginatedResponse(
        items=[EvidenceOut.model_validate(i) for i in items],
        page=page,
        page_size=page_size,
        total=total,
    )


@router.get("/{evidence_id}", response_model=EvidenceOut)
def get_evidence(
    evidence_id: UUID,
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    repo = EvidenceRepository(db, ctx.organization_id)
    row = repo.get(evidence_id)
    if row is None:
        raise AppError("NOT_FOUND", "Evidence not found", 404)
    return EvidenceOut.model_validate(row)


@router.post("/upload", response_model=EvidenceOut, status_code=201)
async def upload_evidence(
    file: UploadFile = File(...),
    document_type_id: UUID = Form(...),
    provider_id: UUID | None = Form(default=None),
    contract_id: UUID | None = Form(default=None),
    ctx: AuthContext = Depends(require_role(Role.SECURITY_MANAGER)),
    db: Session = Depends(get_db),
):
    if not file.filename:
        raise AppError("VALIDATION", "Filename required", 400)
    content = await file.read()
    if len(content) > 25 * 1024 * 1024:
        raise AppError("VALIDATION", "File exceeds 25MB limit", 400)
    doc = db.get(DocumentType, document_type_id)
    if doc is None:
        raise AppError("NOT_FOUND", "Document type not found", 404)
    storage = get_evidence_storage()
    key = f"evidence/{ctx.organization_id}/{uuid.uuid4()}/{file.filename}"
    storage.upload(key, content, content_type=file.content_type)
    digest = hashlib.sha256(content).hexdigest()
    row = Evidence(
        financial_entity_id=ctx.organization_id,
        provider_id=provider_id,
        contract_id=contract_id,
        document_type_id=document_type_id,
        storage_provider=(__import__("os").getenv("STORAGE_PROVIDER") or "local"),
        storage_object_key=key,
        content_hash=digest,
        content_type=file.content_type,
        size_bytes=len(content),
        file_name=file.filename,
        uploaded_by=ctx.user.email,
    )
    db.add(row)
    db.flush()
    record_platform_audit(
        db,
        organization_id=ctx.organization_id,
        actor=ctx.user.email,
        entity_type="Evidence",
        entity_id=row.id,
        action=AuditAction.EVIDENCE_UPLOAD,
        new_value={"file_name": file.filename, "size_bytes": len(content)},
    )
    return EvidenceOut.model_validate(row)


@router.get("/{evidence_id}/download")
def download_evidence(
    evidence_id: UUID,
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    repo = EvidenceRepository(db, ctx.organization_id)
    row = repo.get(evidence_id)
    if row is None:
        raise AppError("NOT_FOUND", "Evidence not found", 404)
    storage = get_evidence_storage()
    if not storage.exists(row.storage_object_key):
        raise AppError("NOT_FOUND", "Evidence file missing in storage", 404)
    data = storage.download(row.storage_object_key)
    return Response(
        content=data,
        media_type=row.content_type or "application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{row.file_name}"'},
    )
