from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext, get_auth_context
from app.core.exceptions import AppError
from app.repositories.evidence import EvidenceRepository
from app.schemas.common import PaginatedResponse
from app.schemas.evidence import EvidenceOut

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
