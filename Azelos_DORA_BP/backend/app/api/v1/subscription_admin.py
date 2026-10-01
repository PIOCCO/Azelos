from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext, require_role
from app.core.rbac import Role
from app.models.enums_saas import SubscriptionStatus
from app.models.saas import OrganizationSubscription

router = APIRouter(prefix="/tenant/subscriptions", tags=["Tenant subscriptions"])


class SubscriptionPatch(BaseModel):
    status: SubscriptionStatus
    plan_key: str | None = None


class SubscriptionOut(BaseModel):
    organization_id: UUID
    status: SubscriptionStatus
    plan_key: str

    model_config = {"from_attributes": True}

    @classmethod
    def from_row(cls, row: OrganizationSubscription) -> "SubscriptionOut":
        return cls(
            organization_id=row.financial_entity_id,
            status=row.status,
            plan_key=row.plan_key,
        )


@router.patch("/{organization_id}", response_model=SubscriptionOut)
def patch_subscription(
    organization_id: UUID,
    body: SubscriptionPatch,
    ctx: AuthContext = Depends(require_role(Role.SUPER_ADMIN)),
    db: Session = Depends(get_db),
):
    sub = db.scalar(
        select(OrganizationSubscription).where(
            OrganizationSubscription.financial_entity_id == organization_id
        )
    )
    if sub is None:
        raise HTTPException(status_code=404, detail="Subscription not found")
    sub.status = body.status
    if body.plan_key:
        sub.plan_key = body.plan_key
    now = datetime.now(timezone.utc)
    if body.status == SubscriptionStatus.ACTIVE:
        sub.activated_at = now
    elif body.status == SubscriptionStatus.SUSPENDED:
        sub.suspended_at = now
    elif body.status == SubscriptionStatus.CANCELLED:
        sub.cancelled_at = now
    db.commit()
    db.refresh(sub)
    return SubscriptionOut.from_row(sub)
