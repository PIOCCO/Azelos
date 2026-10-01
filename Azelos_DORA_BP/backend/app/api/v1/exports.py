import csv
import io
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext, get_auth_context
from app.services.suppliers import SupplierService

router = APIRouter(prefix="/export", tags=["Export"])


@router.get("/ict-providers.csv")
def export_providers_csv(
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
    page_size: int = Query(500, ge=1, le=2000),
):
    items, _ = SupplierService(db, ctx.organization_id).list(1, page_size)
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["id", "legal_name", "country_code", "lei", "status", "provider_type"])
    for p in items:
        writer.writerow(
            [
                str(p.id),
                p.legal_name,
                p.country_code,
                p.lei or "",
                p.status.value if hasattr(p.status, "value") else p.status,
                p.provider_type.value if hasattr(p.provider_type, "value") else p.provider_type,
            ]
        )
    return PlainTextResponse(
        content=buf.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="ict-providers.csv"'},
    )
