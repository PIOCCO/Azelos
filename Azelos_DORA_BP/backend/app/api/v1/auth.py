from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.auth import LoginRequest, TokenResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse, summary="Obtain access token")
def login_json(body: LoginRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    token, org_id, role = service.login(body.email, body.password, body.organization_id)
    return TokenResponse(access_token=token, organization_id=org_id, role=role.value)

