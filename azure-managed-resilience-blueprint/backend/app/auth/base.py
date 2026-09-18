from abc import ABC, abstractmethod

from sqlalchemy.orm import Session

from app.models.entities import User


class AuthProvider(ABC):
    @abstractmethod
    def authenticate(self, db: Session, credentials: dict) -> User | None:
        ...

    @abstractmethod
    def issue_token(self, user: User) -> str:
        ...


class JwtDevAuthProvider(AuthProvider):
    """Development-only JWT authentication. Not production security."""

    def authenticate(self, db: Session, credentials: dict) -> User | None:
        from app.core.security import verify_password

        email = credentials.get("email")
        password = credentials.get("password")
        if not email or not password:
            return None
        user = db.query(User).filter(User.email == email).first()
        if not user or not verify_password(password, user.hashed_password):
            return None
        return user

    def issue_token(self, user: User) -> str:
        from app.core.security import create_access_token

        return create_access_token(user.id, {"role": user.role.value, "tenant_id": user.tenant_id})


class EntraAuthProvider(AuthProvider):
    """Placeholder for Microsoft Entra ID — configure AUTH_MODE=entra in production."""

    def authenticate(self, db: Session, credentials: dict) -> User | None:
        raise NotImplementedError("Entra authentication is not yet implemented. Use AUTH_MODE=jwt for local development.")

    def issue_token(self, user: User) -> str:
        raise NotImplementedError("Entra token exchange not implemented.")


def get_auth_provider() -> AuthProvider:
    from app.core.config import settings

    if settings.auth_mode.lower() == "entra":
        return EntraAuthProvider()
    return JwtDevAuthProvider()
