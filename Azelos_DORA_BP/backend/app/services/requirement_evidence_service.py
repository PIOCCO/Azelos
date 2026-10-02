import hashlib
import os
import uuid
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.core.pdf_validation import validate_pdf_upload
from app.core.upload_policy import sanitize_upload_basename
from app.models.enums import AuditAction
from app.models.evidence import DocumentType, Evidence
from app.models.requirement_evidence import RequirementEvidenceLink
from app.repositories.requirements import RequirementRepository
from app.schemas.evidence import EvidenceOut
from app.services.platform_audit import record_platform_audit
from app.storage.factory import get_evidence_storage


class RequirementEvidenceService:
    def __init__(self, db: Session, organization_id: UUID) -> None:
        self.db = db
        self.organization_id = organization_id

    def upload_pdf(
        self,
        organization_requirement_id: UUID,
        filename: str,
        content: bytes,
        actor_email: str,
    ) -> EvidenceOut:
        org_req = RequirementRepository(self.db, self.organization_id).get_organization_requirement(
            organization_requirement_id
        )
        if org_req is None:
            raise AppError("NOT_FOUND", "Organization requirement not found", 404)

        safe_name = sanitize_upload_basename(filename)
        validate_pdf_upload(content, safe_name)

        doc_type = self.db.scalar(
            select(DocumentType).where(DocumentType.code == "audit_report").limit(1)
        )
        if doc_type is None:
            doc_type = self.db.scalar(select(DocumentType).order_by(DocumentType.code).limit(1))
        if doc_type is None:
            raise AppError("NOT_FOUND", "No document types configured", 404)

        storage = get_evidence_storage()
        object_id = uuid.uuid4()
        key = f"evidence/{self.organization_id}/{object_id}/{safe_name}"
        storage.upload(key, content, content_type="application/pdf")
        digest = hashlib.sha256(content).hexdigest()

        row = Evidence(
            financial_entity_id=self.organization_id,
            provider_id=None,
            contract_id=None,
            document_type_id=doc_type.id,
            storage_provider=(os.getenv("STORAGE_PROVIDER") or "local"),
            storage_object_key=key,
            content_hash=digest,
            content_type="application/pdf",
            size_bytes=len(content),
            file_name=safe_name,
            uploaded_by=actor_email,
        )
        self.db.add(row)
        self.db.flush()

        link = RequirementEvidenceLink(
            financial_entity_id=self.organization_id,
            organization_requirement_id=organization_requirement_id,
            evidence_id=row.id,
        )
        self.db.add(link)
        self.db.flush()

        record_platform_audit(
            self.db,
            organization_id=self.organization_id,
            actor=actor_email,
            entity_type="RequirementEvidenceLink",
            entity_id=link.id,
            action=AuditAction.EVIDENCE_UPLOAD,
            new_value={
                "file_name": safe_name,
                "organization_requirement_id": str(organization_requirement_id),
                "evidence_id": str(row.id),
            },
        )
        return EvidenceOut.model_validate(row)
