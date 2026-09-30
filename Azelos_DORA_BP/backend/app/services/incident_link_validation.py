"""Validate incident links reference entities in the same tenant."""

from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.models.business_function import BusinessFunction
from app.models.cloud_resilience import BusinessService
from app.models.enums_operational import IncidentLinkKind
from app.models.ict_assets import ICTAsset
from app.models.provider import ICTProvider
from app.models.risk import RiskAssessment
from app.models.service import ICTService


def validate_incident_link(
    db: Session,
    organization_id: UUID,
    link_kind: IncidentLinkKind,
    linked_entity_id: UUID,
) -> None:
    org = organization_id
    row = None
    if link_kind == IncidentLinkKind.BUSINESS_FUNCTION:
        row = db.get(BusinessFunction, linked_entity_id)
    elif link_kind == IncidentLinkKind.BUSINESS_SERVICE:
        row = db.get(BusinessService, linked_entity_id)
    elif link_kind == IncidentLinkKind.ICT_ASSET:
        row = db.get(ICTAsset, linked_entity_id)
    elif link_kind == IncidentLinkKind.ICT_SERVICE:
        row = db.get(ICTService, linked_entity_id)
    elif link_kind == IncidentLinkKind.ICT_PROVIDER:
        row = db.get(ICTProvider, linked_entity_id)
    elif link_kind == IncidentLinkKind.RISK_ASSESSMENT:
        row = db.get(RiskAssessment, linked_entity_id)
    if row is None or getattr(row, "financial_entity_id", None) != org:
        raise AppError(
            "NOT_FOUND",
            f"Linked {link_kind.value} not found in organization",
            404,
        )
