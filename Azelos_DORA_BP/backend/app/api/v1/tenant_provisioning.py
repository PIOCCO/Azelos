from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext, require_role
from app.core.rbac import Role
from app.core.security import create_access_token
from app.schemas.organizations import OrganizationOut
from app.services.tenant_provisioning import TenantProvisioningService

router = APIRouter(prefix="/tenant", tags=["Tenant"])


class TenantProvisionIn(BaseModel):
    legal_name: str = Field(min_length=2, max_length=512)
    country_code: str = Field(min_length=2, max_length=2)
    admin_email: EmailStr
    admin_password: str = Field(min_length=12, max_length=128)
    short_name: str | None = None
    lei: str | None = None


class TenantProvisionOut(BaseModel):
    organization: OrganizationOut
    access_token: str
    organization_id: UUID


@router.post("/provision", response_model=TenantProvisionOut, status_code=201)
def provision_tenant(
    body: TenantProvisionIn,
    ctx: AuthContext = Depends(require_role(Role.SUPER_ADMIN)),
    db: Session = Depends(get_db),
):
    entity, user = TenantProvisioningService(db).provision_tenant(
        legal_name=body.legal_name,
        country_code=body.country_code,
        admin_email=body.admin_email,
        admin_password=body.admin_password,
        short_name=body.short_name,
        lei=body.lei,
    )
    db.commit()
    token = create_access_token(str(user.id), {"org_id": str(entity.id), "role": Role.ORG_ADMIN.value})
    return TenantProvisionOut(
        organization=OrganizationOut.model_validate(entity),
        access_token=token,
        organization_id=entity.id,
    )
