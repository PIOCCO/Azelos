from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.models.enums_profile import (
    OrganizationSizeCategory,
    OrganizationType,
    RegulatoryStatus,
)
from app.models.organization_profile import OrganizationProfile
from app.schemas.profile import OrganizationProfileUpdate


class ProfileService:
    def __init__(self, db: Session, organization_id: UUID) -> None:
        self.db = db
        self.organization_id = organization_id

    def get_or_create(self) -> OrganizationProfile:
        row = self.db.scalar(
            select(OrganizationProfile).where(
                OrganizationProfile.financial_entity_id == self.organization_id
            )
        )
        if row is None:
            row = OrganizationProfile(financial_entity_id=self.organization_id)
            self.db.add(row)
            self.db.flush()
        return row

    def get(self) -> OrganizationProfile:
        row = self.db.scalar(
            select(OrganizationProfile).where(
                OrganizationProfile.financial_entity_id == self.organization_id
            )
        )
        if row is None:
            raise AppError("NOT_FOUND", "Organization profile not found", 404)
        return row

    def update(self, data: OrganizationProfileUpdate) -> OrganizationProfile:
        row = self.get_or_create()
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(row, key, val)
        return row
