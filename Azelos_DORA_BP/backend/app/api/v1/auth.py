from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import get_settings
from app.schemas.auth import LoginOptionsOut, LoginRequest, OidcTokenRequest, TokenResponse
from app.services.auth_service import AuthService
from app.services.oidc_service import OidcService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/login-options", response_model=LoginOptionsOut)
def login_options():
    settings = get_settings()
    return LoginOptionsOut(
        oidc_enabled=settings.oidc_enabled,
        oidc_client_id=settings.oidc_client_id or None,
        oidc_issuer_url=settings.oidc_issuer_url or None,
    )


@router.post("/login", response_model=TokenResponse, summary="Obtain access token")
def login_json(body: LoginRequest, db: Session = Depends(get_db)):
    from app.models.enums import AuditAction
    from app.services.platform_audit import record_platform_audit

    from sqlalchemy import select

    from app.models.auth import User

    service = AuthService(db)
    token, org_id, role = service.login(body.email, body.password, body.organization_id)
    user = db.scalar(select(User).where(User.email == body.email))
    if user is not None:
        record_platform_audit(
            db,
            organization_id=org_id,
            actor=body.email,
            entity_type="user",
            entity_id=user.id,
            action=AuditAction.LOGIN,
            new_value={"role": role.value},
        )
    return TokenResponse(access_token=token, organization_id=org_id, role=role.value)


@router.post("/oidc/token", response_model=TokenResponse, summary="Exchange OIDC id_token for API JWT")
def oidc_token(body: OidcTokenRequest, db: Session = Depends(get_db)):
    token, org_id, role = OidcService(db).login_with_id_token(
        body.id_token, body.organization_id
    )
    db.commit()
    return TokenResponse(access_token=token, organization_id=org_id, role=role)

