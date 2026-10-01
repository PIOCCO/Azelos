from __future__ import annotations

import csv
from uuid import UUID

from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.models.enums import ProviderStatus, ProviderType
from app.models.provider import ICTProvider
from app.repositories.suppliers import SupplierRepository
from app.schemas.suppliers import SupplierCreate, SupplierUpdate


class SupplierService:
    def __init__(self, db: Session, organization_id: UUID) -> None:
        self.repo = SupplierRepository(db, organization_id)

    def list(self, page: int, page_size: int, *, q: str | None = None):
        return self.repo.list_paginated(page, page_size, q=q)

    def get(self, supplier_id: UUID) -> ICTProvider:
        row = self.repo.get(supplier_id)
        if row is None:
            raise AppError("NOT_FOUND", "Supplier not found", 404)
        return row

    def create(self, data: SupplierCreate) -> ICTProvider:
        return self.repo.create(
            ICTProvider(
                legal_name=data.legal_name,
                trading_name=data.trading_name,
                lei=data.lei,
                country_code=data.country_code.upper(),
                provider_type=ProviderType.ICT_THIRD_PARTY,
                status=ProviderStatus.ACTIVE,
            )
        )

    def update(self, supplier_id: UUID, data: SupplierUpdate) -> ICTProvider:
        row = self.get(supplier_id)
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(row, key, val)
        return row

    def import_from_csv_rows(
        self, reader: csv.DictReader
    ) -> tuple[int, int, list[str]]:
        created = 0
        skipped = 0
        errors: list[str] = []
        for line_no, row in enumerate(reader, start=2):
            legal = (row.get("legal_name") or "").strip()
            if not legal:
                skipped += 1
                continue
            country = (row.get("country_code") or "DE").strip().upper()
            try:
                data = SupplierCreate(
                    legal_name=legal,
                    country_code=country,
                    trading_name=(row.get("trading_name") or "").strip() or None,
                    lei=(row.get("lei") or "").strip() or None,
                )
                self.create(data)
                created += 1
            except ValidationError as exc:
                errors.append(f"Line {line_no}: {exc.errors()[0]['msg']}")
            except Exception as exc:  # noqa: BLE001 — surface row-level import issues
                errors.append(f"Line {line_no}: {exc}")
        return created, skipped, errors
