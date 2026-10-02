from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext, require_role
from app.core.rbac import Role
from app.schemas.tenant_integrations import (
    ConnectionTestResult,
    HttpApiIntegrationUpsert,
    IntegrationOut,
    PostgreSQLIntegrationUpsert,
)
from app.services.tenant_integration_service import TenantIntegrationService

router = APIRouter(prefix="/integrations", tags=["Integrations"])


def _service(db: Session, ctx: AuthContext) -> TenantIntegrationService:
    return TenantIntegrationService(db, ctx.organization_id, actor_id=ctx.user.email)


@router.get("", response_model=list[IntegrationOut])
def list_integrations(
    ctx: AuthContext = Depends(require_role(Role.ORG_ADMIN)),
    db: Session = Depends(get_db),
):
    rows = _service(db, ctx).list_integrations()
    return [IntegrationOut.model_validate(r) for r in rows]


@router.post("/postgresql", response_model=IntegrationOut, status_code=status.HTTP_201_CREATED)
def create_postgresql_integration(
    body: PostgreSQLIntegrationUpsert,
    ctx: AuthContext = Depends(require_role(Role.ORG_ADMIN)),
    db: Session = Depends(get_db),
):
    svc = _service(db, ctx)
    try:
        row = svc.upsert_postgresql(
            name=body.name,
            host=body.host,
            port=body.port,
            database=body.database,
            username=body.username,
            password=body.password,
            ssl_mode=body.ssl_mode,
        )
    except ValueError as e:
        if str(e) == "password_required":
            raise HTTPException(status_code=400, detail="Password is required.") from e
        raise
    db.commit()
    db.refresh(row)
    return IntegrationOut.model_validate(row)


@router.put("/postgresql/{integration_id}", response_model=IntegrationOut)
def update_postgresql_integration(
    integration_id: UUID,
    body: PostgreSQLIntegrationUpsert,
    ctx: AuthContext = Depends(require_role(Role.ORG_ADMIN)),
    db: Session = Depends(get_db),
):
    svc = _service(db, ctx)
    try:
        row = svc.upsert_postgresql(
            integration_id=integration_id,
            name=body.name,
            host=body.host,
            port=body.port,
            database=body.database,
            username=body.username,
            password=body.password,
            ssl_mode=body.ssl_mode,
        )
    except LookupError:
        raise HTTPException(status_code=404, detail="Not found") from None
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid integration type.") from None
    db.commit()
    db.refresh(row)
    return IntegrationOut.model_validate(row)


@router.post("/http-api", response_model=IntegrationOut, status_code=status.HTTP_201_CREATED)
def create_http_integration(
    body: HttpApiIntegrationUpsert,
    ctx: AuthContext = Depends(require_role(Role.ORG_ADMIN)),
    db: Session = Depends(get_db),
):
    row = _service(db, ctx).upsert_http_api(
        name=body.name,
        base_url=body.base_url,
        auth_type=body.auth_type,
        api_key=body.api_key,
    )
    db.commit()
    db.refresh(row)
    return IntegrationOut.model_validate(row)


@router.put("/http-api/{integration_id}", response_model=IntegrationOut)
def update_http_integration(
    integration_id: UUID,
    body: HttpApiIntegrationUpsert,
    ctx: AuthContext = Depends(require_role(Role.ORG_ADMIN)),
    db: Session = Depends(get_db),
):
    svc = _service(db, ctx)
    try:
        row = svc.upsert_http_api(
            integration_id=integration_id,
            name=body.name,
            base_url=body.base_url,
            auth_type=body.auth_type,
            api_key=body.api_key,
        )
    except LookupError:
        raise HTTPException(status_code=404, detail="Not found") from None
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid integration type.") from None
    db.commit()
    db.refresh(row)
    return IntegrationOut.model_validate(row)


@router.post("/{integration_id}/test", response_model=ConnectionTestResult)
def test_integration(
    integration_id: UUID,
    ctx: AuthContext = Depends(require_role(Role.ORG_ADMIN)),
    db: Session = Depends(get_db),
):
    svc = _service(db, ctx)
    try:
        ok, message = svc.test_connection(integration_id)
    except LookupError:
        raise HTTPException(status_code=404, detail="Not found") from None
    db.commit()
    row = svc.get_for_org(integration_id)
    st = row.status if row else ""
    if hasattr(st, "value"):
        st = st.value
    return ConnectionTestResult(success=ok, message=message, status=str(st))


@router.post("/{integration_id}/disable", response_model=IntegrationOut)
def disable_integration(
    integration_id: UUID,
    ctx: AuthContext = Depends(require_role(Role.ORG_ADMIN)),
    db: Session = Depends(get_db),
):
    svc = _service(db, ctx)
    try:
        row = svc.disable(integration_id)
    except LookupError:
        raise HTTPException(status_code=404, detail="Not found") from None
    db.commit()
    db.refresh(row)
    return IntegrationOut.model_validate(row)
