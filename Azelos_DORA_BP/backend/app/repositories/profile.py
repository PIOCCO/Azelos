from uuid import UUID

from sqlalchemy import select

from app.models.organization_profile import OrganizationProfile
from app.repositories.base import OrgScopedRepository


class ProfileRepository(OrgScopedRepository):
    def get(self) -> OrganizationProfile | None:
        return self.db.scalar(
            select(OrganizationProfile).where(
                OrganizationProfile.financial_entity_id == self.organization_id
            )
        )

    def save(self, profile: OrganizationProfile) -> OrganizationProfile:
        self.db.add(profile)
        self.db.flush()
        return profile
