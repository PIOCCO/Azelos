from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.session import get_db
from app.models.entities import User, UserRole

bearer = HTTPBearer(auto_error=False)


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    if not creds:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = decode_token(creds.credentials)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.get(User, payload["sub"])
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def require_roles(*roles: UserRole):
    def _inner(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user

    return _inner


def resolve_tenant_id(user: User, requested: str | None) -> str:
    if user.role == UserRole.PROVIDER_ADMIN or user.role == UserRole.OPERATOR:
        if not requested:
            raise HTTPException(status_code=400, detail="tenant_id required for provider scope")
        return requested
    if not user.tenant_id:
        raise HTTPException(status_code=403, detail="Customer user missing tenant")
    if requested and requested != user.tenant_id:
        raise HTTPException(status_code=403, detail="Cross-tenant access denied")
    return user.tenant_id
