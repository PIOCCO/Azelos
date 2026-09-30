from uuid import UUID

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext, require_role
from app.core.rbac import Role
from app.services.dependency_mapping_service import DependencyMappingService

router = APIRouter(prefix="/dependencies", tags=["Dependencies"])


class FunctionServiceLinkIn(BaseModel):
    business_function_id: UUID
    ict_service_id: UUID


class FunctionServiceLinkOut(BaseModel):
    id: UUID
    function_id: UUID
    service_id: UUID


@router.post("/function-service", response_model=FunctionServiceLinkOut, status_code=201)
def link_function_service(
    body: FunctionServiceLinkIn,
    ctx: AuthContext = Depends(require_role(Role.ORG_ADMIN)),
    db: Session = Depends(get_db),
):
    row = DependencyMappingService(db, ctx.organization_id).link_function_service(
        body.business_function_id, body.ict_service_id, ctx.user.email
    )
    db.commit()
    return FunctionServiceLinkOut(id=row.id, function_id=row.function_id, service_id=row.service_id)


@router.delete("/function-service", status_code=status.HTTP_204_NO_CONTENT)
def unlink_function_service(
    business_function_id: UUID,
    ict_service_id: UUID,
    ctx: AuthContext = Depends(require_role(Role.ORG_ADMIN)),
    db: Session = Depends(get_db),
):
    DependencyMappingService(db, ctx.organization_id).unlink_function_service(
        business_function_id, ict_service_id, ctx.user.email
    )
    db.commit()
