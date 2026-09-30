import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums_operational import IncidentLinkKind, IncidentSeverity, IncidentStatus


class IncidentLinkIn(BaseModel):
    link_kind: IncidentLinkKind
    linked_entity_id: uuid.UUID
    notes: str | None = None


class IncidentLinkOut(IncidentLinkIn):
    id: uuid.UUID

    model_config = {"from_attributes": True}


class IncidentTimelineIn(BaseModel):
    event_type: str = Field(max_length=128)
    description: str
    actor: str = Field(max_length=256)


class IncidentTimelineOut(IncidentTimelineIn):
    id: uuid.UUID
    recorded_at: datetime

    model_config = {"from_attributes": True}


class IncidentCreate(BaseModel):
    title: str = Field(max_length=512)
    description: str | None = None
    severity: IncidentSeverity
    owner: str | None = None
    is_major: bool = False
    detected_at: datetime | None = None
    links: list[IncidentLinkIn] = Field(default_factory=list)


class IncidentUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=512)
    description: str | None = None
    severity: IncidentSeverity | None = None
    status: IncidentStatus | None = None
    owner: str | None = None
    is_major: bool | None = None
    root_cause: str | None = None
    lessons_learned: str | None = None


class IncidentOut(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None
    severity: IncidentSeverity
    status: IncidentStatus
    is_major: bool
    owner: str | None
    detected_at: datetime | None
    classified_at: datetime | None
    contained_at: datetime | None
    resolved_at: datetime | None
    closed_at: datetime | None
    root_cause: str | None
    lessons_learned: str | None
    created_at: datetime
    updated_at: datetime
    links: list[IncidentLinkOut] = []
    timeline: list[IncidentTimelineOut] = []

    model_config = {"from_attributes": True}
