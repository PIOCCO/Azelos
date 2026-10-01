from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext, require_role
from app.core.rbac import Role
from app.models.enums_saas import SubscriptionStatus
from app.models.financial_entity import FinancialEntity
from app.models.saas import OrganizationSubscription
from app.services.tenant_data_service import TenantDataService

router = APIRouter(prefix="/tenant/data", tags=["Tenant data"])


@router.get("/export")
def export_tenant_data(
    ctx: AuthContext = Depends(require_role(Role.ORG_ADMIN)),
    db: Session = Depends(get_db),
):
    payload = TenantDataService(db, ctx.organization_id).export_zip()
    return Response(
        content=payload,
        media_type="application/zip",
        headers={"Content-Disposition": 'attachment; filename="tenant-export.zip"'},
    )


@router.post("/request-deletion", status_code=202)
def request_tenant_deletion(
    ctx: AuthContext = Depends(require_role(Role.ORG_ADMIN)),
    db: Session = Depends(get_db),
):
    """Mark subscription cancelled; platform completes hard delete separately."""
    entity = db.get(FinancialEntity, ctx.organization_id)
    if entity is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    sub = db.scalar(
        select(OrganizationSubscription).where(
            OrganizationSubscription.financial_entity_id == ctx.organization_id
        )
    )
    if sub is None:
        raise HTTPException(status_code=404, detail="Subscription not found")
    sub.status = SubscriptionStatus.CANCELLED
    sub.cancelled_at = datetime.now(timezone.utc)
    entity.status = "cancelled"
    db.commit()
    return {"status": "cancelled", "message": "Deletion request recorded. Export data before retention ends."}
