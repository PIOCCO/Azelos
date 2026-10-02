"""Persist per-tenant Relationship Map node positions (organization_settings JSON)."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext, get_auth_context
from app.schemas.relationship_map_layout import (
    RelationshipMapLayoutOut,
    RelationshipMapLayoutUpdate,
)
from app.services.configuration_service import ConfigurationService
from app.services.relationship_map_layout_service import (
    RELATIONSHIP_MAP_LAYOUT_KEY,
    layout_from_setting_value,
    layout_to_setting_value,
)

router = APIRouter(prefix="/dora/relationship-map", tags=["Relationship map"])


@router.get("/layout", response_model=RelationshipMapLayoutOut)
def get_relationship_map_layout(
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    service = ConfigurationService(db, ctx.organization_id)
    rows = {r.setting_key: r.value for r in service.get_settings()}
    raw = rows.get(RELATIONSHIP_MAP_LAYOUT_KEY)
    positions = layout_from_setting_value(raw)
    return RelationshipMapLayoutOut(positions=positions)


@router.put("/layout", response_model=RelationshipMapLayoutOut)
def put_relationship_map_layout(
    body: RelationshipMapLayoutUpdate,
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    service = ConfigurationService(db, ctx.organization_id, actor_id=str(ctx.user.id))
    payload = layout_to_setting_value(body.positions)
    service.set_setting(RELATIONSHIP_MAP_LAYOUT_KEY, payload)
    db.flush()
    return RelationshipMapLayoutOut(positions=body.positions)
