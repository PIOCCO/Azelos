from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.core.passwords import hash_password
from app.core.rbac import Role
from app.models.auth import OrganizationMembership, User
from app.models.saas import UserInvitation


class InvitationService:
    def __init__(self, db: Session, organization_id: UUID) -> None:
        self.db = db
        self.organization_id = organization_id

    def create_invitation(
        self, *, email: str, role: Role, invited_by: str, expires_hours: int = 72
    ) -> tuple[UserInvitation, str]:
        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        row = UserInvitation(
            financial_entity_id=self.organization_id,
            email=email.lower().strip(),
            role=role,
            token_hash=token_hash,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=expires_hours),
            invited_by=invited_by,
        )
        self.db.add(row)
        self.db.flush()
        return row, token

    def accept_invitation(
        self, *, token: str, password: str, full_name: str | None = None
    ) -> User:
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        invite = self.db.scalar(
            select(UserInvitation).where(UserInvitation.token_hash == token_hash)
        )
        if invite is None or invite.accepted_at is not None:
            raise AppError("NOT_FOUND", "Invalid invitation", 404)
        if invite.expires_at < datetime.now(timezone.utc):
            raise AppError("EXPIRED", "Invitation expired", 400)
        user = self.db.scalar(select(User).where(User.email == invite.email))
        if user is None:
            user = User(
                email=invite.email,
                hashed_password=hash_password(password),
                full_name=full_name,
                is_active=True,
            )
            self.db.add(user)
            self.db.flush()
        membership = self.db.scalar(
            select(OrganizationMembership).where(
                OrganizationMembership.user_id == user.id,
                OrganizationMembership.financial_entity_id == invite.financial_entity_id,
            )
        )
        if membership is None:
            self.db.add(
                OrganizationMembership(
                    user_id=user.id,
                    financial_entity_id=invite.financial_entity_id,
                    role=invite.role,
                )
            )
        invite.accepted_at = datetime.now(timezone.utc)
        self.db.flush()
        return user
