"""Block mutating API calls for suspended/cancelled tenants."""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.core.security import decode_access_token
from app.core.database import SessionLocal
from app.models.enums_saas import SubscriptionStatus
from app.models.saas import OrganizationSubscription
from jose import JWTError


MUTATION_PREFIXES = ("/api/v1/",)
READONLY_SUFFIXES = (
    "/export",
    "/download",
    "/health",
    "/ready",
    "/audit-records",
)
EXEMPT_PATHS = (
    "/api/v1/auth/",
    "/api/v1/tenant/",
    "/health",
    "/ready",
    "/docs",
    "/openapi.json",
)


class SubscriptionGateMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return await call_next(request)
        path = request.url.path
        if any(path.startswith(ex) for ex in EXEMPT_PATHS):
            return await call_next(request)
        if any(path.endswith(s) for s in READONLY_SUFFIXES):
            return await call_next(request)
        if not any(path.startswith(p) for p in MUTATION_PREFIXES):
            return await call_next(request)
        auth = request.headers.get("authorization") or ""
        if not auth.lower().startswith("bearer "):
            return await call_next(request)
        token = auth.split(" ", 1)[1]
        try:
            payload = decode_access_token(token)
            org_raw = payload.get("org_id")
            if not org_raw:
                return await call_next(request)
        except JWTError:
            return await call_next(request)
        from uuid import UUID
        from sqlalchemy import select

        with SessionLocal() as db:
            sub = db.scalar(
                select(OrganizationSubscription).where(
                    OrganizationSubscription.financial_entity_id == UUID(org_raw)
                )
            )
            if sub is None:
                return await call_next(request)
            if sub.status in (SubscriptionStatus.SUSPENDED, SubscriptionStatus.CANCELLED):
                return JSONResponse(
                    status_code=403,
                    content={
                        "error": {
                            "code": "SUBSCRIPTION_INACTIVE",
                            "message": f"Organization subscription is {sub.status.value}",
                        }
                    },
                )
        return await call_next(request)
