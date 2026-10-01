"""Validate Entra ID / OIDC id_tokens and issue application JWT."""

from __future__ import annotations

import json
from uuid import UUID

import httpx
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.exceptions import AppError
from app.core.security import create_access_token
from app.models.auth import OrganizationMembership, User


class OidcService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.settings = get_settings()

    def _jwks(self) -> dict:
        issuer = self.settings.oidc_issuer_url.rstrip("/")
        url = f"{issuer}/.well-known/openid-configuration"
        with httpx.Client(timeout=10.0) as client:
            meta = client.get(url)
            meta.raise_for_status()
            jwks_uri = meta.json()["jwks_uri"]
            keys = client.get(jwks_uri)
            keys.raise_for_status()
            return keys.json()

    def login_with_id_token(
        self, id_token: str, organization_id: UUID | None
    ) -> tuple[str, UUID, str]:
        if not self.settings.oidc_enabled:
            raise AppError("OIDC_DISABLED", "OIDC login is not enabled", 400)
        if not self.settings.oidc_issuer_url or not self.settings.oidc_client_id:
            raise AppError("OIDC_MISCONFIGURED", "OIDC issuer/client not configured", 500)
        try:
            claims = jwt.decode(
                id_token,
                self._jwks(),
                algorithms=["RS256"],
                audience=self.settings.oidc_client_id,
                options={"verify_at_hash": False},
            )
        except JWTError as exc:
            raise AppError("INVALID_TOKEN", "Invalid id_token", 401) from exc
        sub = claims.get("sub")
        email = claims.get("email") or claims.get("preferred_username")
        if not sub or not email:
            raise AppError("INVALID_TOKEN", "Token missing sub or email", 401)
        user = self.db.scalar(select(User).where(User.external_subject == sub))
        if user is None:
            user = self.db.scalar(select(User).where(User.email == email))
        if user is None:
            user = User(email=email, external_subject=sub, is_active=True)
            self.db.add(user)
            self.db.flush()
        elif user.external_subject is None:
            user.external_subject = sub
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
        return token, membership.financial_entity_id, membership.role.value
