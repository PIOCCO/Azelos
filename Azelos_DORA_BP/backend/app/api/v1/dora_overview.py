from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext, get_auth_context
from app.schemas.dora_overview import DoraOverviewOut
from app.services.dora_overview import build_dora_overview

router = APIRouter(prefix="/dora", tags=["DORA"])


@router.get("/overview", response_model=DoraOverviewOut)
def dora_overview(
    db: Session = Depends(get_db),
    ctx: AuthContext = Depends(get_auth_context),
) -> DoraOverviewOut:
    return build_dora_overview(db, ctx.organization_id)
