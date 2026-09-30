from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext, require_role
from app.core.rbac import Role
from app.services.tenant_data_service import TenantDataService

router = APIRouter(prefix="/tenant/data", tags=["Tenant data"])


@router.get("/export")
def export_tenant_data(
    ctx: AuthContext = Depends(require_role(Role.ORG_ADMIN)),
    db: Session = Depends(get_db),
):
    payload = TenantDataService(db, ctx.organization_id).export_zip()
    return Response(
        content=payload,
        media_type="application/zip",
        headers={"Content-Disposition": 'attachment; filename="tenant-export.zip"'},
    )
