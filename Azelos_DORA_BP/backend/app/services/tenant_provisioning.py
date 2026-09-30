from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.core.passwords import hash_password
from app.core.rbac import Role
from app.models.auth import OrganizationMembership, User
from app.models.dora_baseline import DoraRequirement, OrganizationRequirement
from app.models.enums_saas import SubscriptionStatus
from app.models.financial_entity import FinancialEntity
from app.models.organization_profile import OrganizationProfile
from app.models.saas import OrganizationSubscription
from app.services.profile_service import ProfileService


class TenantProvisioningService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def _seed_org_requirements(self, org_id: UUID) -> None:
        existing = self.db.scalar(
            select(OrganizationRequirement.id)
            .where(OrganizationRequirement.financial_entity_id == org_id)
            .limit(1)
        )
        if existing:
            return
        for req in self.db.scalars(select(DoraRequirement)).all():
            self.db.add(
                OrganizationRequirement(
                    financial_entity_id=org_id,
                    dora_requirement_id=req.id,
                    applicable=True,
                    implementation_status="not_started",
                )
            )

    def provision_tenant(
        self,
        *,
        legal_name: str,
        country_code: str,
        admin_email: str,
        admin_password: str,
        short_name: str | None = None,
        lei: str | None = None,
        trial_days: int = 30,
    ) -> tuple[FinancialEntity, User]:
        entity = FinancialEntity(
            legal_name=legal_name,
            short_name=short_name,
            country_code=country_code.upper(),
            lei=lei,
            status="active",
        )
        self.db.add(entity)
        self.db.flush()
        self.db.add(
            OrganizationSubscription(
                financial_entity_id=entity.id,
                plan_key="standard",
                status=SubscriptionStatus.TRIAL,
                trial_ends_at=datetime.now(timezone.utc) + timedelta(days=trial_days),
            )
        )
        ProfileService(self.db, entity.id).get_or_create()
        self._seed_org_requirements(entity.id)
        user = self.db.scalar(select(User).where(User.email == admin_email))
        if user is None:
            user = User(
                email=admin_email,
                hashed_password=hash_password(admin_password),
                is_active=True,
            )
            self.db.add(user)
            self.db.flush()
        else:
            if not user.hashed_password:
                raise AppError("CONFLICT", "User exists with SSO-only login", 409)
        existing = self.db.scalar(
            select(OrganizationMembership).where(
                OrganizationMembership.user_id == user.id,
                OrganizationMembership.financial_entity_id == entity.id,
            )
        )
        if existing is None:
            self.db.add(
                OrganizationMembership(
                    user_id=user.id,
                    financial_entity_id=entity.id,
                    role=Role.ORG_ADMIN,
                )
            )
        self.db.flush()
        return entity, user
