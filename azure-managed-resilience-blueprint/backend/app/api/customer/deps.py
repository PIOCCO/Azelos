from fastapi import Depends, HTTPException, status

from app.api.deps import get_current_user
from app.models.entities import User, UserRole

CUSTOMER_ROLES = {UserRole.CUSTOMER_ADMIN, UserRole.CUSTOMER_VIEWER}


def require_customer_user(user: User = Depends(get_current_user)) -> User:
    if user.role not in CUSTOMER_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Customer portal access only")
    if not user.tenant_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Customer tenant not assigned")
    return user


def customer_tenant_id(user: User = Depends(require_customer_user)) -> str:
    return user.tenant_id  # type: ignore[return-value]


def require_customer_admin(user: User = Depends(require_customer_user)) -> User:
    if user.role != UserRole.CUSTOMER_ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Customer admin required")
    return user
