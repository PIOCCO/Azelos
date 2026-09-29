"""FastAPI dependencies — MVP header-based org + admin gate."""

from __future__ import annotations

import uuid
from dataclasses import dataclass

from fastapi import Header, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import SessionLocal


@dataclass
class RequestContext:
    organization_id: uuid.UUID
    actor_id: str
    is_admin: bool


def get_db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def get_request_context(
    x_organization_id: str = Header(..., alias="X-Organization-Id"),
    x_user_id: str = Header("anonymous", alias="X-User-Id"),
    x_user_role: str = Header("user", alias="X-User-Role"),
) -> RequestContext:
    try:
        org_id = uuid.UUID(x_organization_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid X-Organization-Id",
        ) from exc
    role = x_user_role.lower().strip()
    return RequestContext(
        organization_id=org_id,
        actor_id=x_user_id[:256],
        is_admin=role == "admin",
    )


def require_admin(ctx: RequestContext) -> None:
    if not ctx.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin required")


def assert_org_path(org_id: uuid.UUID, ctx: RequestContext) -> None:
    if org_id != ctx.organization_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cross-tenant denied")
