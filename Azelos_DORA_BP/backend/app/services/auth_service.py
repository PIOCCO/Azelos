from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.core.rbac import Role
from app.core.security import create_access_token, verify_password
from app.models.auth import OrganizationMembership, User


class AuthService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def login(self, email: str, password: str, organization_id: UUID | None) -> tuple[str, UUID, Role]:
        user = self.db.scalar(select(User).where(User.email == email))
        if user is None or not user.hashed_password:
            raise AppError("INVALID_CREDENTIALS", "Invalid email or password", 401)
        if not verify_password(password, user.hashed_password):
            raise AppError("INVALID_CREDENTIALS", "Invalid email or password", 401)
        memberships = self.db.scalars(
            select(OrganizationMembership).where(OrganizationMembership.user_id == user.id)
        ).all()
        if not memberships:
            raise AppError("NO_MEMBERSHIP", "User has no organization membership", 403)
        membership = memberships[0]
        if organization_id is not None:
            membership = next(
                (m for m in memberships if m.financial_entity_id == organization_id),
                None,
            )
            if membership is None:
                raise AppError("FORBIDDEN", "Not a member of organization", 403)
        token = create_access_token(
            str(user.id),
            {"org_id": str(membership.financial_entity_id), "role": membership.role.value},
        )
        return token, membership.financial_entity_id, membership.role
