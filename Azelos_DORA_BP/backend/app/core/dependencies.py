from dataclasses import dataclass
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.rbac import Role, role_at_least
from app.core.security import decode_access_token
from app.models.auth import OrganizationMembership, User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


@dataclass
class AuthContext:
    user: User
    organization_id: UUID
    role: Role


def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> User:
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc
    user = db.get(User, UUID(user_id))
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="Inactive user")
    return user


def get_auth_context(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    token: str = Depends(oauth2_scheme),
) -> AuthContext:
    try:
        payload = decode_access_token(token)
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc
    org_raw = payload.get("org_id")
    role_raw = payload.get("role", Role.USER.value)
    if not org_raw:
        raise HTTPException(status_code=403, detail="Organization context required")
    org_id = UUID(org_raw)
    membership = db.scalar(
        select(OrganizationMembership).where(
            OrganizationMembership.user_id == user.id,
            OrganizationMembership.financial_entity_id == org_id,
        )
    )
    if membership is None:
        raise HTTPException(status_code=403, detail="Not a member of organization")
    return AuthContext(user=user, organization_id=org_id, role=membership.role)


def require_role(minimum: Role):
    def _dep(ctx: AuthContext = Depends(get_auth_context)) -> AuthContext:
        if not role_at_least(ctx.role, minimum):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return ctx

    return _dep
