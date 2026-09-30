import json
import zipfile
from io import BytesIO
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.financial_entity import FinancialEntity
from app.models.provider import ICTProvider
from app.repositories.evidence import EvidenceRepository


class TenantDataService:
    def __init__(self, db: Session, organization_id: UUID) -> None:
        self.db = db
        self.organization_id = organization_id

    def export_zip(self) -> bytes:
        entity = self.db.get(FinancialEntity, self.organization_id)
        if entity is None:
            raise ValueError("Organization not found")
        buf = BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr(
                "organization.json",
                json.dumps(
                    {
                        "id": str(entity.id),
                        "legal_name": entity.legal_name,
                        "country_code": entity.country_code,
                    },
                    indent=2,
                ),
            )
            providers = self.db.scalars(
                select(ICTProvider).where(ICTProvider.financial_entity_id == self.organization_id)
            ).all()
            zf.writestr(
                "ict_providers.json",
                json.dumps(
                    [{"id": str(p.id), "legal_name": p.legal_name} for p in providers],
                    indent=2,
                ),
            )
            evidence_repo = EvidenceRepository(self.db, self.organization_id)
            items, _ = evidence_repo.list_paginated(1, 500)
            zf.writestr(
                "evidence_index.json",
                json.dumps(
                    [{"id": str(e.id), "file_name": e.file_name} for e in items],
                    indent=2,
                ),
            )
        return buf.getvalue()
