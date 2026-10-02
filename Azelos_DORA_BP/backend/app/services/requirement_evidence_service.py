from uuid import UUID

from sqlalchemy.orm import Session

from app.schemas.evidence import EvidenceOut
from app.services.evidence_attachment_service import EvidenceAttachmentService, EvidenceEntityType


class RequirementEvidenceService:
    """Backward-compatible wrapper for organization-requirement PDF uploads."""

    def __init__(self, db: Session, organization_id: UUID) -> None:
        self._attachments = EvidenceAttachmentService(db, organization_id)

    def upload_pdf(
        self,
        organization_requirement_id: UUID,
        filename: str,
        content: bytes,
        actor_email: str,
    ) -> EvidenceOut:
        return self._attachments.upload_pdf(
            EvidenceEntityType.ORGANIZATION_REQUIREMENT,
            organization_requirement_id,
            filename,
            content,
            actor_email,
        )
