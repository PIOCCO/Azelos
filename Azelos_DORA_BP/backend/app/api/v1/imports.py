import csv
import io

from fastapi import APIRouter, Depends, File, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext, require_role
from app.core.rbac import Role
from app.core.upload_policy import validate_upload_content_type, validate_upload_filename
from app.models.enums import AuditAction
from app.services.platform_audit import record_platform_audit
from app.services.suppliers import SupplierService

router = APIRouter(prefix="/import", tags=["Import"])


class ProviderImportResult(BaseModel):
    created: int
    skipped: int
    errors: list[str]


@router.post("/ict-providers.csv", response_model=ProviderImportResult)
async def import_providers_csv(
    file: UploadFile = File(...),
    ctx: AuthContext = Depends(require_role(Role.SECURITY_MANAGER)),
    db: Session = Depends(get_db),
):
    validate_upload_filename(file.filename or "import.csv")
    validate_upload_content_type(file.content_type)
    raw = await file.read()
    if len(raw) > 2_000_000:
        from app.core.exceptions import AppError

        raise AppError("FILE_TOO_LARGE", "CSV must be under 2MB", 400)
    text = raw.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames or "legal_name" not in reader.fieldnames:
        from app.core.exceptions import AppError

        raise AppError("INVALID_CSV", "CSV must include a legal_name column", 400)

    service = SupplierService(db, ctx.organization_id)
    created, skipped, errors = service.import_from_csv_rows(reader)
    if created:
        record_platform_audit(
            db,
            organization_id=ctx.organization_id,
            actor=ctx.user.email,
            entity_type="ICTProvider",
            entity_id=ctx.organization_id,
            action=AuditAction.CREATE,
            new_value={"csv_import_created": created},
        )
    db.flush()
    return ProviderImportResult(created=created, skipped=skipped, errors=errors)
