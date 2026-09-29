from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext, get_auth_context, require_role
from app.core.rbac import Role
from app.models.financial_entity import FinancialEntity
from app.repositories.organizations import OrganizationRepository
from app.schemas.organizations import OrganizationCreate, OrganizationOut, OrganizationUpdate

router = APIRouter(prefix="/organizations", tags=["Organizations"])


@router.get("", response_model=list[OrganizationOut])
def list_organizations(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    if ctx.role == Role.SUPER_ADMIN:
        repo = OrganizationRepository(db, ctx.organization_id)
        rows, _ = repo.list_paginated(page, page_size)
        return rows
    entity = db.get(FinancialEntity, ctx.organization_id)
    return [entity] if entity else []


@router.get("/{org_id}", response_model=OrganizationOut)
def get_organization(
    org_id: UUID,
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    if org_id != ctx.organization_id and ctx.role != Role.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Forbidden")
    entity = db.get(FinancialEntity, org_id)
    if entity is None:
        raise HTTPException(status_code=404, detail="Not found")
    return entity


@router.post("", response_model=OrganizationOut, status_code=201)
def create_organization(
    body: OrganizationCreate,
    ctx: AuthContext = Depends(require_role(Role.SUPER_ADMIN)),
    db: Session = Depends(get_db),
):
    repo = OrganizationRepository(db, ctx.organization_id)
    entity = repo.create(
        FinancialEntity(
            legal_name=body.legal_name,
            short_name=body.short_name,
            country_code=body.country_code.upper(),
            lei=body.lei,
        )
    )
    db.flush()
    db.refresh(entity)
    return entity


@router.patch("/{org_id}", response_model=OrganizationOut)
def patch_organization(
    org_id: UUID,
    body: OrganizationUpdate,
    ctx: AuthContext = Depends(require_role(Role.ORG_ADMIN)),
    db: Session = Depends(get_db),
):
    if org_id != ctx.organization_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    entity = db.get(FinancialEntity, org_id)
    if entity is None:
        raise HTTPException(status_code=404, detail="Not found")
    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(entity, key, val)
    db.flush()
    db.refresh(entity)
    return entity
