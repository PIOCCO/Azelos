from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext, get_auth_context, require_role
from app.core.rbac import Role
from app.schemas.common import PaginatedResponse
from app.schemas.incidents import (
    IncidentCreate,
    IncidentOut,
    IncidentTimelineIn,
    IncidentUpdate,
)
from app.services.incidents import IncidentService

router = APIRouter(prefix="/incidents", tags=["Incidents"])


def _actor(ctx: AuthContext) -> str:
    return ctx.user.email


@router.get("", response_model=PaginatedResponse)
def list_incidents(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    status: str | None = None,
    severity: str | None = None,
    q: str | None = None,
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    service = IncidentService(db, ctx.organization_id)
    items, total = service.list(page, page_size, status=status, severity=severity, q=q)
    return PaginatedResponse(
        items=[IncidentOut.model_validate(i) for i in items],
        page=page,
        page_size=page_size,
        total=total,
    )


@router.get("/{incident_id}", response_model=IncidentOut)
def get_incident(
    incident_id: UUID,
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    return IncidentOut.model_validate(IncidentService(db, ctx.organization_id).get(incident_id))


@router.post("", response_model=IncidentOut, status_code=201)
def create_incident(
    body: IncidentCreate,
    ctx: AuthContext = Depends(require_role(Role.SECURITY_MANAGER)),
    db: Session = Depends(get_db),
):
    service = IncidentService(db, ctx.organization_id)
    row = service.create(body, _actor(ctx))
    db.flush()
    db.refresh(row)
    return IncidentOut.model_validate(service.get(row.id))


@router.patch("/{incident_id}", response_model=IncidentOut)
def patch_incident(
    incident_id: UUID,
    body: IncidentUpdate,
    ctx: AuthContext = Depends(require_role(Role.SECURITY_MANAGER)),
    db: Session = Depends(get_db),
):
    service = IncidentService(db, ctx.organization_id)
    row = service.update(incident_id, body, _actor(ctx))
    db.flush()
    return IncidentOut.model_validate(service.get(row.id))


@router.post("/{incident_id}/timeline", response_model=IncidentOut)
def add_timeline(
    incident_id: UUID,
    body: IncidentTimelineIn,
    ctx: AuthContext = Depends(require_role(Role.SECURITY_MANAGER)),
    db: Session = Depends(get_db),
):
    service = IncidentService(db, ctx.organization_id)
    service.add_timeline(incident_id, body, _actor(ctx))
    db.flush()
    return IncidentOut.model_validate(service.get(incident_id))


@router.delete("/{incident_id}", status_code=204)
def archive_incident(
    incident_id: UUID,
    ctx: AuthContext = Depends(require_role(Role.SECURITY_MANAGER)),
    db: Session = Depends(get_db),
):
    IncidentService(db, ctx.organization_id).archive(incident_id, _actor(ctx))
    db.flush()
    return None
