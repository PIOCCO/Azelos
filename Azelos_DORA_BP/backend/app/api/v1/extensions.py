from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext, get_auth_context, require_role
from app.core.rbac import Role
from app.models.extensions import ExtensionRegistration
from app.schemas.extensions import ExtensionCreate, ExtensionOut, ExtensionUpdate

router = APIRouter(prefix="/extensions", tags=["Extensions"])


@router.get("", response_model=list[ExtensionOut], summary="List extension metadata")
def list_extensions(
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    rows = db.scalars(
        select(ExtensionRegistration).where(
            ExtensionRegistration.financial_entity_id == ctx.organization_id
        )
    ).all()
    return rows


@router.post("", response_model=ExtensionOut, status_code=201)
def register_extension(
    body: ExtensionCreate,
    ctx: AuthContext = Depends(require_role(Role.ORG_ADMIN)),
    db: Session = Depends(get_db),
):
    row = ExtensionRegistration(
        financial_entity_id=ctx.organization_id,
        name=body.name,
        description=body.description,
        version=body.version,
        owner=body.owner,
        resource_type=body.resource_type,
    )
    db.add(row)
    db.flush()
    db.refresh(row)
    return row


@router.get("/{extension_id}", response_model=ExtensionOut)
def get_extension(
    extension_id: UUID,
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    row = db.get(ExtensionRegistration, extension_id)
    if row is None or row.financial_entity_id != ctx.organization_id:
        raise HTTPException(status_code=404, detail="Not found")
    return row


@router.patch("/{extension_id}", response_model=ExtensionOut)
def patch_extension(
    extension_id: UUID,
    body: ExtensionUpdate,
    ctx: AuthContext = Depends(require_role(Role.ORG_ADMIN)),
    db: Session = Depends(get_db),
):
    row = db.get(ExtensionRegistration, extension_id)
    if row is None or row.financial_entity_id != ctx.organization_id:
        raise HTTPException(status_code=404, detail="Not found")
    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(row, key, val)
    db.flush()
    db.refresh(row)
    return row
