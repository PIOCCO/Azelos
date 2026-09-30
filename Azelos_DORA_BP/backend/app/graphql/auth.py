from uuid import UUID

from fastapi import HTTPException, Request
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import AuthContext
from app.core.rbac import Role
from app.core.security import decode_access_token
from app.models.auth import OrganizationMembership, User


def auth_from_request(request: Request, db: Session) -> AuthContext | None:
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None
    token = header.split(" ", 1)[1]
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        org_raw = payload.get("org_id")
        if not user_id or not org_raw:
            return None
        user = db.get(User, UUID(user_id))
        if user is None or not user.is_active:
            return None
        org_id = UUID(org_raw)
        membership = db.scalar(
            select(OrganizationMembership).where(
                OrganizationMembership.user_id == user.id,
                OrganizationMembership.financial_entity_id == org_id,
            )
        )
        if membership is None:
            return None
        return AuthContext(user=user, organization_id=org_id, role=membership.role)
    except (JWTError, ValueError):
        return None
