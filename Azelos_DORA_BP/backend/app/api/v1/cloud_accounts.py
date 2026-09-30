from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext, get_auth_context, require_role
from app.core.exceptions import AppError
from app.core.rbac import Role
from app.models.cloud_resilience import CloudAccount
from app.models.enums import AuditAction
from app.schemas.cloud_resilience import CloudAccountCreate, CloudAccountOut
from app.schemas.common import PaginatedResponse
from app.services.cloud_discovery import run_discovery
from app.services.platform_audit import record_platform_audit

router = APIRouter(prefix="/cloud-accounts", tags=["Cloud Environment"])


def _get_account(db: Session, org_id: UUID, account_id: UUID) -> CloudAccount:
    row = db.get(CloudAccount, account_id)
    if row is None or row.financial_entity_id != org_id:
        raise AppError("NOT_FOUND", "Cloud account not found", 404)
    return row


@router.get("", response_model=PaginatedResponse)
def list_cloud_accounts(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    total = (
        db.scalar(
            select(func.count(CloudAccount.id)).where(
                CloudAccount.financial_entity_id == ctx.organization_id
            )
        )
        or 0
    )
    rows = db.scalars(
        select(CloudAccount)
        .where(CloudAccount.financial_entity_id == ctx.organization_id)
        .order_by(CloudAccount.display_name)
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return PaginatedResponse(
        items=[CloudAccountOut.model_validate(r) for r in rows],
        page=page,
        page_size=page_size,
        total=total,
    )


@router.post("", response_model=CloudAccountOut, status_code=201)
def create_cloud_account(
    body: CloudAccountCreate,
    ctx: AuthContext = Depends(require_role(Role.SECURITY_MANAGER)),
    db: Session = Depends(get_db),
):
    row = CloudAccount(
        financial_entity_id=ctx.organization_id,
        provider=body.provider,
        display_name=body.display_name,
        subscription_id=body.subscription_id,
        tenant_id=body.tenant_id,
        default_region=body.default_region,
        auth_config_ref=body.auth_config_ref,
    )
    db.add(row)
    db.flush()
    record_platform_audit(
        db,
        organization_id=ctx.organization_id,
        actor=ctx.user.email,
        entity_type="cloud_account",
        entity_id=row.id,
        action=AuditAction.CLOUD_CONNECT,
        new_value={"subscription_id": body.subscription_id, "provider": body.provider.value},
    )
    db.refresh(row)
    return CloudAccountOut.model_validate(row)


@router.post("/{account_id}/discover")
def discover_resources(
    account_id: UUID,
    ctx: AuthContext = Depends(require_role(Role.SECURITY_MANAGER)),
    db: Session = Depends(get_db),
):
    account = _get_account(db, ctx.organization_id, account_id)
    return run_discovery(
        db,
        organization_id=ctx.organization_id,
        account=account,
        actor=ctx.user.email,
    )
