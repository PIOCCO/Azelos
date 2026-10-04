from uuid import UUID

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext, get_auth_context, require_role
from app.core.exceptions import AppError
from app.core.rbac import Role
from app.schemas.evidence import EvidenceOut
from app.schemas.evidence_attachment import EvidenceAttachmentOut
from app.services.evidence_attachment_service import EvidenceAttachmentService, EvidenceEntityType

router = APIRouter(prefix="/evidence-attachments", tags=["Evidence attachments"])

_ENTITY_MAP = {
    "organization_requirement": EvidenceEntityType.ORGANIZATION_REQUIREMENT,
    "ict_provider": EvidenceEntityType.ICT_PROVIDER,
    "contract": EvidenceEntityType.CONTRACT,
    "contract_control": EvidenceEntityType.CONTRACT_CONTROL,
}


def _parse_entity_type(raw: str) -> EvidenceEntityType:
    try:
        return _ENTITY_MAP[raw]
    except KeyError as exc:
        raise AppError("VALIDATION", f"Unsupported entity type: {raw}", 400) from exc


@router.get("/{entity_type}/{entity_id}", response_model=list[EvidenceAttachmentOut])
def list_entity_evidence(
    entity_type: str,
    entity_id: UUID,
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    et = _parse_entity_type(entity_type)
    return EvidenceAttachmentService(db, ctx.organization_id).list_for_entity(et, entity_id)


@router.post(
    "/{entity_type}/{entity_id}",
    response_model=EvidenceOut,
    status_code=201,
)
async def upload_entity_evidence(
    entity_type: str,
    entity_id: UUID,
    file: UploadFile = File(...),
    ctx: AuthContext = Depends(require_role(Role.SECURITY_MANAGER)),
    db: Session = Depends(get_db),
):
    et = _parse_entity_type(entity_type)
    content = await file.read()
    out = EvidenceAttachmentService(db, ctx.organization_id).upload_pdf(
        et,
        entity_id,
        file.filename or "evidence.pdf",
        content,
        ctx.user.email,
    )
    db.commit()
    return out


@router.delete(
    "/{entity_type}/{entity_id}/{evidence_id}",
    status_code=204,
)
def delete_entity_evidence(
    entity_type: str,
    entity_id: UUID,
    evidence_id: UUID,
    ctx: AuthContext = Depends(require_role(Role.SECURITY_MANAGER)),
    db: Session = Depends(get_db),
):
    et = _parse_entity_type(entity_type)
    EvidenceAttachmentService(db, ctx.organization_id).delete_pdf(
        et, entity_id, evidence_id, ctx.user.email
    )
    db.commit()
