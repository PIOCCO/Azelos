from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext, get_auth_context, require_role
from app.core.rbac import Role
from app.licensing.enums import LicenseAccessMode, LicensePlan, LicenseStatus
from app.licensing.schema import LicenseEnvelope
from app.licensing.service import LicenseEvaluation, LicenseService, LicenseValidationError

router = APIRouter(prefix="/license", tags=["License"])


class LicenseInstallIn(BaseModel):
    envelope: LicenseEnvelope


class LicenseStatusOut(BaseModel):
    validation_ok: bool
    access_mode: LicenseAccessMode
    effective_status: LicenseStatus | None
    license_id: UUID | None
    organization_id: UUID
    customer_name: str | None
    plan: LicensePlan | None
    starts_at: str | None
    expires_at: str | None
    days_remaining: int | None
    max_users: int | None
    enabled_modules: list[str] | None
    warnings: list[str]
    message: str | None
    read_only: bool
    enforcement_enabled: bool

    @classmethod
    def from_evaluation(
        cls, organization_id: UUID, evaluation: LicenseEvaluation
    ) -> "LicenseStatusOut":
        read_only = evaluation.access_mode in (
            LicenseAccessMode.READ_ONLY,
            LicenseAccessMode.NOT_STARTED,
            LicenseAccessMode.UNLICENSED,
            LicenseAccessMode.BLOCKED,
        )
        return cls(
            validation_ok=evaluation.validation_ok,
            access_mode=evaluation.access_mode,
            effective_status=evaluation.effective_status,
            license_id=evaluation.license_id,
            organization_id=organization_id,
            customer_name=evaluation.customer_name,
            plan=evaluation.plan,
            starts_at=evaluation.starts_at.isoformat() if evaluation.starts_at else None,
            expires_at=evaluation.expires_at.isoformat() if evaluation.expires_at else None,
            days_remaining=evaluation.days_remaining,
            max_users=evaluation.max_users,
            enabled_modules=evaluation.enabled_modules,
            warnings=evaluation.warnings,
            message=evaluation.message,
            read_only=read_only,
            enforcement_enabled=LicenseService.enforcement_enabled(),
        )


@router.get("/status", response_model=LicenseStatusOut)
def get_license_status(
    ctx: AuthContext = Depends(require_role(Role.ORG_ADMIN)),
    db: Session = Depends(get_db),
):
    evaluation = LicenseService(db).evaluate_for_organization(ctx.organization_id)
    return LicenseStatusOut.from_evaluation(ctx.organization_id, evaluation)


@router.get("/status/me", response_model=LicenseStatusOut)
def get_license_status_any_member(
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    """Non-admin users see read-only banner context (no secrets)."""
    evaluation = LicenseService(db).evaluate_for_organization(ctx.organization_id)
    return LicenseStatusOut.from_evaluation(ctx.organization_id, evaluation)


@router.post("/install", response_model=LicenseStatusOut)
def install_license(
    body: LicenseInstallIn,
    ctx: AuthContext = Depends(require_role(Role.ORG_ADMIN)),
    db: Session = Depends(get_db),
):
    svc = LicenseService(db)
    try:
        evaluation = svc.install_envelope(
            body.envelope,
            organization_id=ctx.organization_id,
            installed_by=ctx.user.email,
            event="installed",
        )
        db.commit()
    except LicenseValidationError as exc:
        raise HTTPException(status_code=400, detail=exc.message) from exc
    return LicenseStatusOut.from_evaluation(ctx.organization_id, evaluation)


@router.post("/replace", response_model=LicenseStatusOut)
def replace_license(
    body: LicenseInstallIn,
    ctx: AuthContext = Depends(require_role(Role.ORG_ADMIN)),
    db: Session = Depends(get_db),
):
    svc = LicenseService(db)
    try:
        evaluation = svc.install_envelope(
            body.envelope,
            organization_id=ctx.organization_id,
            installed_by=ctx.user.email,
            event="renewed",
        )
        db.commit()
    except LicenseValidationError as exc:
        raise HTTPException(status_code=400, detail=exc.message) from exc
    return LicenseStatusOut.from_evaluation(ctx.organization_id, evaluation)
