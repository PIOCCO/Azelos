from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.models.enums import AuditAction
from app.models.enums_operational import IncidentSeverity, IncidentStatus
from app.models.operational import ICTIncident, IncidentEntityLink, IncidentTimelineEvent
from app.repositories.incidents import IncidentRepository
from app.schemas.incidents import IncidentCreate, IncidentTimelineIn, IncidentUpdate
from app.services.platform_audit import record_platform_audit


def _major_from_severity(severity: IncidentSeverity, is_major: bool) -> bool:
    return is_major or severity in (IncidentSeverity.CRITICAL, IncidentSeverity.HIGH)


class IncidentService:
    def __init__(self, db: Session, organization_id: UUID) -> None:
        self.db = db
        self.repo = IncidentRepository(db, organization_id)
        self.organization_id = organization_id

    def list(self, page: int, page_size: int, **filters):
        return self.repo.list_paginated(page, page_size, **filters)

    def get(self, incident_id: UUID) -> ICTIncident:
        row = self.repo.get(incident_id)
        if row is None:
            raise AppError("NOT_FOUND", "Incident not found", 404)
        return row

    def create(self, data: IncidentCreate, actor: str) -> ICTIncident:
        now = datetime.now(timezone.utc)
        row = ICTIncident(
            title=data.title,
            description=data.description,
            severity=data.severity,
            status=IncidentStatus.DETECTED,
            owner=data.owner,
            is_major=_major_from_severity(data.severity, data.is_major),
            detected_at=data.detected_at or now,
        )
        self.repo.save(row)
        for link in data.links:
            row.links.append(
                IncidentEntityLink(
                    link_kind=link.link_kind,
                    linked_entity_id=link.linked_entity_id,
                    notes=link.notes,
                )
            )
        row.timeline.append(
            IncidentTimelineEvent(
                event_type="detected",
                description=f"Incident recorded: {data.title}",
                actor=actor,
                recorded_at=now,
            )
        )
        record_platform_audit(
            self.db,
            organization_id=self.organization_id,
            actor=actor,
            entity_type="ICTIncident",
            entity_id=row.id,
            action=AuditAction.CREATE,
            new_value={"title": data.title, "severity": data.severity.value},
        )
        return row

    def update(self, incident_id: UUID, data: IncidentUpdate, actor: str) -> ICTIncident:
        row = self.get(incident_id)
        old_status = row.status
        now = datetime.now(timezone.utc)
        patch = data.model_dump(exclude_unset=True)
        for key, val in patch.items():
            setattr(row, key, val)
        if data.severity is not None or data.is_major is not None:
            row.is_major = _major_from_severity(row.severity, row.is_major)
        if data.status and data.status != old_status:
            row.timeline.append(
                IncidentTimelineEvent(
                    event_type="status_change",
                    description=f"Status {old_status.value} → {data.status.value}",
                    actor=actor,
                    recorded_at=now,
                )
            )
            if data.status == IncidentStatus.CLASSIFIED and not row.classified_at:
                row.classified_at = now
            if data.status == IncidentStatus.CONTAINED and not row.contained_at:
                row.contained_at = now
            if data.status == IncidentStatus.RESOLVED and not row.resolved_at:
                row.resolved_at = now
            if data.status == IncidentStatus.CLOSED and not row.closed_at:
                row.closed_at = now
        record_platform_audit(
            self.db,
            organization_id=self.organization_id,
            actor=actor,
            entity_type="ICTIncident",
            entity_id=row.id,
            action=AuditAction.UPDATE,
            new_value=patch,
        )
        return row

    def add_timeline(self, incident_id: UUID, data: IncidentTimelineIn, actor: str) -> ICTIncident:
        row = self.get(incident_id)
        row.timeline.append(
            IncidentTimelineEvent(
                event_type=data.event_type,
                description=data.description,
                actor=data.actor or actor,
                recorded_at=datetime.now(timezone.utc),
            )
        )
        return row

    def archive(self, incident_id: UUID, actor: str) -> ICTIncident:
        row = self.get(incident_id)
        row.archived_at = datetime.now(timezone.utc)
        record_platform_audit(
            self.db,
            organization_id=self.organization_id,
            actor=actor,
            entity_type="ICTIncident",
            entity_id=row.id,
            action=AuditAction.DELETE,
            notes="archived",
        )
        return row
