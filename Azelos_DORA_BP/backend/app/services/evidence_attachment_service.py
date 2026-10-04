"""Tenant-scoped PDF evidence attachments for DORA records."""

from __future__ import annotations

import hashlib
import os
import uuid
from collections import defaultdict
from enum import StrEnum
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.exceptions import AppError
from app.core.pdf_validation import validate_pdf_upload
from app.core.upload_policy import sanitize_upload_basename
from app.models.contract import Contract
from app.models.dora_control import ContractDoraControl, EvidenceControlLink
from app.models.enums import AuditAction
from app.models.evidence import DocumentType, Evidence
from app.models.provider import ICTProvider
from app.models.requirement_evidence import RequirementEvidenceLink
from app.repositories.requirements import RequirementRepository
from app.schemas.evidence import EvidenceOut
from app.schemas.evidence_attachment import EvidenceAttachmentOut
from app.services.platform_audit import record_platform_audit
from app.storage.factory import get_evidence_storage


class EvidenceEntityType(StrEnum):
    ORGANIZATION_REQUIREMENT = "organization_requirement"
    ICT_PROVIDER = "ict_provider"
    CONTRACT = "contract"
    CONTRACT_CONTROL = "contract_control"


class EvidenceAttachmentService:
    def __init__(self, db: Session, organization_id: UUID) -> None:
        self.db = db
        self.organization_id = organization_id

    def list_for_entity(self, entity_type: EvidenceEntityType, entity_id: UUID) -> list[EvidenceAttachmentOut]:
        grouped = self._load_grouped(entity_type, {entity_id})
        return grouped.get(entity_id, [])

    def grouped_for_entity_type(
        self, entity_type: EvidenceEntityType, entity_ids: set[UUID] | None = None
    ) -> dict[UUID, list[EvidenceAttachmentOut]]:
        return self._load_grouped(entity_type, entity_ids)

    def upload_pdf(
        self,
        entity_type: EvidenceEntityType,
        entity_id: UUID,
        filename: str,
        content: bytes,
        actor_email: str,
    ) -> EvidenceOut:
        self._assert_entity(entity_type, entity_id)
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

        provider_id: UUID | None = None
        contract_id: UUID | None = None
        if entity_type == EvidenceEntityType.ICT_PROVIDER:
            provider_id = entity_id
        elif entity_type == EvidenceEntityType.CONTRACT:
            contract_id = entity_id

        row = Evidence(
            financial_entity_id=self.organization_id,
            provider_id=provider_id,
            contract_id=contract_id,
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

        if entity_type == EvidenceEntityType.ORGANIZATION_REQUIREMENT:
            link = RequirementEvidenceLink(
                financial_entity_id=self.organization_id,
                organization_requirement_id=entity_id,
                evidence_id=row.id,
            )
            self.db.add(link)
            self.db.flush()
            audit_entity = "RequirementEvidenceLink"
            audit_id = link.id
        elif entity_type == EvidenceEntityType.CONTRACT_CONTROL:
            link = EvidenceControlLink(evidence_id=row.id, contract_control_id=entity_id)
            self.db.add(link)
            self.db.flush()
            audit_entity = "EvidenceControlLink"
            audit_id = link.id
        else:
            audit_entity = "Evidence"
            audit_id = row.id

        record_platform_audit(
            self.db,
            organization_id=self.organization_id,
            actor=actor_email,
            entity_type=audit_entity,
            entity_id=audit_id,
            action=AuditAction.EVIDENCE_UPLOAD,
            new_value={
                "file_name": safe_name,
                "entity_type": entity_type.value,
                "entity_id": str(entity_id),
                "evidence_id": str(row.id),
            },
        )
        return EvidenceOut.model_validate(row)

    def delete_pdf(
        self,
        entity_type: EvidenceEntityType,
        entity_id: UUID,
        evidence_id: UUID,
        actor_email: str,
    ) -> None:
        self._assert_entity(entity_type, entity_id)
        ev = self.db.get(Evidence, evidence_id)
        if ev is None or ev.financial_entity_id != self.organization_id:
            raise AppError("NOT_FOUND", "Evidence not found", 404)

        if entity_type == EvidenceEntityType.ORGANIZATION_REQUIREMENT:
            link = self.db.scalar(
                select(RequirementEvidenceLink).where(
                    RequirementEvidenceLink.financial_entity_id == self.organization_id,
                    RequirementEvidenceLink.organization_requirement_id == entity_id,
                    RequirementEvidenceLink.evidence_id == evidence_id,
                )
            )
            if link is None:
                raise AppError("NOT_FOUND", "Evidence not linked to this requirement", 404)
            self.db.delete(link)
        elif entity_type == EvidenceEntityType.CONTRACT_CONTROL:
            link = self.db.scalar(
                select(EvidenceControlLink).where(
                    EvidenceControlLink.contract_control_id == entity_id,
                    EvidenceControlLink.evidence_id == evidence_id,
                )
            )
            if link is None:
                raise AppError("NOT_FOUND", "Evidence not linked to this control", 404)
            self.db.delete(link)
        elif entity_type == EvidenceEntityType.ICT_PROVIDER:
            if ev.provider_id != entity_id:
                raise AppError("NOT_FOUND", "Evidence not linked to this provider", 404)
        elif entity_type == EvidenceEntityType.CONTRACT:
            if ev.contract_id != entity_id:
                raise AppError("NOT_FOUND", "Evidence not linked to this contract", 404)
        else:
            raise AppError("VALIDATION", "Unsupported entity type", 400)

        storage = get_evidence_storage()
        if ev.storage_object_key and storage.exists(ev.storage_object_key):
            storage.delete(ev.storage_object_key)

        file_name = ev.file_name
        self.db.delete(ev)
        self.db.flush()

        record_platform_audit(
            self.db,
            organization_id=self.organization_id,
            actor=actor_email,
            entity_type="Evidence",
            entity_id=evidence_id,
            action=AuditAction.DELETE,
            new_value={
                "file_name": file_name,
                "entity_type": entity_type.value,
                "entity_id": str(entity_id),
            },
        )

    def _assert_entity(self, entity_type: EvidenceEntityType, entity_id: UUID) -> None:
        if entity_type == EvidenceEntityType.ORGANIZATION_REQUIREMENT:
            row = RequirementRepository(self.db, self.organization_id).get_organization_requirement(
                entity_id
            )
            if row is None:
                raise AppError("NOT_FOUND", "Organization requirement not found", 404)
            return
        if entity_type == EvidenceEntityType.ICT_PROVIDER:
            row = self.db.get(ICTProvider, entity_id)
            if row is None or row.financial_entity_id != self.organization_id:
                raise AppError("NOT_FOUND", "ICT provider not found", 404)
            return
        if entity_type == EvidenceEntityType.CONTRACT:
            row = self.db.get(Contract, entity_id)
            if row is None or row.financial_entity_id != self.organization_id:
                raise AppError("NOT_FOUND", "Contract not found", 404)
            return
        if entity_type == EvidenceEntityType.CONTRACT_CONTROL:
            row = self.db.get(ContractDoraControl, entity_id)
            if row is None or row.financial_entity_id != self.organization_id:
                raise AppError("NOT_FOUND", "Contract control not found", 404)
            return
        raise AppError("VALIDATION", "Unsupported entity type", 400)

    def _load_grouped(
        self,
        entity_type: EvidenceEntityType,
        entity_ids: set[UUID] | None,
    ) -> dict[UUID, list[EvidenceAttachmentOut]]:
        grouped: dict[UUID, list[EvidenceAttachmentOut]] = defaultdict(list)

        if entity_type == EvidenceEntityType.ORGANIZATION_REQUIREMENT:
            q = (
                select(RequirementEvidenceLink)
                .where(RequirementEvidenceLink.financial_entity_id == self.organization_id)
                .options(selectinload(RequirementEvidenceLink.evidence))
                .order_by(RequirementEvidenceLink.created_at)
            )
            if entity_ids:
                q = q.where(RequirementEvidenceLink.organization_requirement_id.in_(entity_ids))
            for link in self.db.scalars(q).all():
                ev = link.evidence
                grouped[link.organization_requirement_id].append(
                    EvidenceAttachmentOut(
                        link_id=link.id,
                        evidence_id=ev.id,
                        file_name=ev.file_name,
                        uploaded_at=ev.uploaded_at,
                    )
                )
            return grouped

        if entity_type == EvidenceEntityType.ICT_PROVIDER:
            q = select(Evidence).where(
                Evidence.financial_entity_id == self.organization_id,
                Evidence.provider_id.is_not(None),
            )
            if entity_ids:
                q = q.where(Evidence.provider_id.in_(entity_ids))
            for ev in self.db.scalars(q.order_by(Evidence.uploaded_at)).all():
                assert ev.provider_id is not None
                grouped[ev.provider_id].append(
                    EvidenceAttachmentOut(
                        link_id=None,
                        evidence_id=ev.id,
                        file_name=ev.file_name,
                        uploaded_at=ev.uploaded_at,
                    )
                )
            return grouped

        if entity_type == EvidenceEntityType.CONTRACT:
            q = select(Evidence).where(
                Evidence.financial_entity_id == self.organization_id,
                Evidence.contract_id.is_not(None),
            )
            if entity_ids:
                q = q.where(Evidence.contract_id.in_(entity_ids))
            for ev in self.db.scalars(q.order_by(Evidence.uploaded_at)).all():
                assert ev.contract_id is not None
                grouped[ev.contract_id].append(
                    EvidenceAttachmentOut(
                        link_id=None,
                        evidence_id=ev.id,
                        file_name=ev.file_name,
                        uploaded_at=ev.uploaded_at,
                    )
                )
            return grouped

        if entity_type == EvidenceEntityType.CONTRACT_CONTROL:
            q = (
                select(EvidenceControlLink)
                .join(ContractDoraControl)
                .where(ContractDoraControl.financial_entity_id == self.organization_id)
                .options(
                    selectinload(EvidenceControlLink.evidence),
                    selectinload(EvidenceControlLink.contract_control),
                )
            )
            if entity_ids:
                q = q.where(EvidenceControlLink.contract_control_id.in_(entity_ids))
            for link in self.db.scalars(q).all():
                ev = link.evidence
                grouped[link.contract_control_id].append(
                    EvidenceAttachmentOut(
                        link_id=link.id,
                        evidence_id=ev.id,
                        file_name=ev.file_name,
                        uploaded_at=ev.uploaded_at,
                    )
                )
            return grouped

        return grouped
