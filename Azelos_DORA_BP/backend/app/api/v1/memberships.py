from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext, require_role
from app.core.rbac import Role
from app.core.security import create_access_token
from app.models.enums import AuditAction
from app.services.invitation_service import InvitationService
from app.services.platform_audit import record_platform_audit

router = APIRouter(prefix="/memberships", tags=["Memberships"])


class InviteIn(BaseModel):
    email: EmailStr
    role: Role = Role.USER


class InviteOut(BaseModel):
    invitation_id: UUID
    email: str
    invite_token: str
    expires_at: str


class AcceptInviteIn(BaseModel):
    token: str
    password: str = Field(min_length=12, max_length=128)
    full_name: str | None = None


class AcceptInviteOut(BaseModel):
    access_token: str
    organization_id: UUID


@router.post("/invitations", response_model=InviteOut, status_code=201)
def create_invitation(
    body: InviteIn,
    ctx: AuthContext = Depends(require_role(Role.ORG_ADMIN)),
    db: Session = Depends(get_db),
):
    svc = InvitationService(db, ctx.organization_id)
    row, token = svc.create_invitation(
        email=body.email, role=body.role, invited_by=ctx.user.email
    )
    record_platform_audit(
        db,
        organization_id=ctx.organization_id,
        actor=ctx.user.email,
        entity_type="UserInvitation",
        entity_id=row.id,
        action=AuditAction.CREATE,
    )
    db.commit()
    return InviteOut(
        invitation_id=row.id,
        email=row.email,
        invite_token=token,
        expires_at=row.expires_at.isoformat(),
    )


@router.post("/invitations/accept", response_model=AcceptInviteOut)
def accept_invitation(body: AcceptInviteIn, db: Session = Depends(get_db)):
    import hashlib
    from sqlalchemy import select
    from app.models.saas import UserInvitation

    token_hash = hashlib.sha256(body.token.encode()).hexdigest()
    invite = db.scalar(select(UserInvitation).where(UserInvitation.token_hash == token_hash))
    if invite is None:
        from app.core.exceptions import AppError

        raise AppError("NOT_FOUND", "Invalid invitation", 404)
    user = InvitationService(db, invite.financial_entity_id).accept_invitation(
        token=body.token, password=body.password, full_name=body.full_name
    )
    db.commit()
    membership_role = invite.role
    token = create_access_token(
        str(user.id),
        {"org_id": str(invite.financial_entity_id), "role": membership_role.value},
    )
    return AcceptInviteOut(access_token=token, organization_id=invite.financial_entity_id)
