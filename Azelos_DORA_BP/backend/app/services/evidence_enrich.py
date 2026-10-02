from uuid import UUID

from sqlalchemy.orm import Session

from app.models.contract import Contract
from app.models.provider import ICTProvider
from app.models.service import ICTService
from app.schemas.contracts import ContractOut
from app.schemas.ict_services import ICTServiceOut
from app.schemas.suppliers import SupplierOut
from app.services.evidence_attachment_service import EvidenceAttachmentService, EvidenceEntityType


def suppliers_with_evidence(
    db: Session, organization_id: UUID, items: list[ICTProvider]
) -> list[SupplierOut]:
    grouped = EvidenceAttachmentService(db, organization_id).grouped_for_entity_type(
        EvidenceEntityType.ICT_PROVIDER, {i.id for i in items}
    )
    return [
        SupplierOut.model_validate(i).model_copy(
            update={"evidence_files": grouped.get(i.id, [])}
        )
        for i in items
    ]


def supplier_with_evidence(db: Session, organization_id: UUID, item: ICTProvider) -> SupplierOut:
    return suppliers_with_evidence(db, organization_id, [item])[0]


def contracts_with_evidence(
    db: Session, organization_id: UUID, items: list[Contract]
) -> list[ContractOut]:
    grouped = EvidenceAttachmentService(db, organization_id).grouped_for_entity_type(
        EvidenceEntityType.CONTRACT, {i.id for i in items}
    )
    return [
        ContractOut.model_validate(i).model_copy(
            update={"evidence_files": grouped.get(i.id, [])}
        )
        for i in items
    ]


def contract_with_evidence(db: Session, organization_id: UUID, item: Contract) -> ContractOut:
    return contracts_with_evidence(db, organization_id, [item])[0]


def ict_services_with_contract_evidence(
    db: Session, organization_id: UUID, items: list[ICTService]
) -> list[ICTServiceOut]:
    """Attach contract-level PDF evidence (services inherit their contract's evidence files)."""
    contract_ids = {i.contract_id for i in items}
    grouped = EvidenceAttachmentService(db, organization_id).grouped_for_entity_type(
        EvidenceEntityType.CONTRACT, contract_ids
    )
    return [
        ICTServiceOut.model_validate(i).model_copy(
            update={"evidence_files": grouped.get(i.contract_id, [])}
        )
        for i in items
    ]
