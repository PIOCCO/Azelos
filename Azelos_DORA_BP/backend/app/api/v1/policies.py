from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext, get_auth_context
from app.schemas.policies import PolicyAcceptIn, PolicyAcceptOut, PolicyDocumentOut, PolicyStatusOut
from app.services.policy_acceptance_service import PolicyAcceptanceService

router = APIRouter(prefix="/policies", tags=["Policies"])


@router.get("/status", response_model=PolicyStatusOut)
def policy_status(
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    return PolicyAcceptanceService(db).status_payload(ctx.user.id, ctx.organization_id)


@router.get("/documents/{policy_key}", response_model=PolicyDocumentOut)
def policy_document(
    policy_key: str,
    locale: str = "en",
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    _ = ctx
    return PolicyAcceptanceService(db).document_payload(policy_key, locale)


@router.post("/accept", response_model=PolicyAcceptOut)
def accept_policies(
    body: PolicyAcceptIn,
    request: Request,
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    if not body.confirm:
        from fastapi import HTTPException

        raise HTTPException(status_code=400, detail="Confirmation required")
    service = PolicyAcceptanceService(db)
    created = service.record_bundle_acceptance(ctx.user.id, ctx.organization_id, request)
    db.commit()
    missing = service.missing_policies(ctx.user.id, ctx.organization_id)
    return PolicyAcceptOut(all_accepted=len(missing) == 0, recorded_count=len(created))
