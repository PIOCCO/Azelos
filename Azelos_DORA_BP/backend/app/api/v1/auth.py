from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.auth import LoginRequest, OidcTokenRequest, TokenResponse
from app.services.auth_service import AuthService
from app.services.oidc_service import OidcService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse, summary="Obtain access token")
def login_json(body: LoginRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    token, org_id, role = service.login(body.email, body.password, body.organization_id)
    return TokenResponse(access_token=token, organization_id=org_id, role=role.value)


@router.post("/oidc/token", response_model=TokenResponse, summary="Exchange OIDC id_token for API JWT")
def oidc_token(body: OidcTokenRequest, db: Session = Depends(get_db)):
    token, org_id, role = OidcService(db).login_with_id_token(
        body.id_token, body.organization_id
    )
    db.commit()
    return TokenResponse(access_token=token, organization_id=org_id, role=role)

