"""Central license enforcement for mutating HTTP requests."""

from __future__ import annotations

import logging
from uuid import UUID

from jose import JWTError
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.core.database import SessionLocal
from app.core.security import decode_access_token
from app.licensing.enums import LicenseAccessMode
from app.licensing.service import LicenseService
from app.models.enums_saas import SubscriptionStatus
from app.models.saas import OrganizationSubscription
from sqlalchemy import select

log = logging.getLogger("app.license_gate")

MUTATION_METHODS = frozenset({"POST", "PUT", "PATCH", "DELETE"})

EXEMPT_PATH_PREFIXES = (
    "/api/v1/auth/",
    "/health",
    "/ready",
    "/docs",
    "/openapi.json",
    "/redoc",
    "/graphql",  # read-only GraphQL queries use POST
)

# Writes allowed in read-only / expired mode (renewal + policy acceptance for login flow)
READONLY_ALLOWED_WRITE_PREFIXES = (
    "/api/v1/license/",
    "/api/v1/policies/",
)

READONLY_ALLOWED_WRITE_SUFFIXES = (
    "/export",
    "/download",
)


class LicenseEnforcementMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method not in MUTATION_METHODS:
            return await call_next(request)

        path = request.url.path
        if any(path.startswith(p) for p in EXEMPT_PATH_PREFIXES):
            return await call_next(request)
        if any(path.startswith(p) for p in READONLY_ALLOWED_WRITE_PREFIXES):
            return await call_next(request)
        if any(path.endswith(s) for s in READONLY_ALLOWED_WRITE_SUFFIXES):
            return await call_next(request)
        if not path.startswith("/api/v1/") and not path.startswith("/graphql"):
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
            org_id = UUID(org_raw)
        except (JWTError, ValueError):
            return await call_next(request)

        with SessionLocal() as db:
            sub = db.scalar(
                select(OrganizationSubscription).where(
                    OrganizationSubscription.financial_entity_id == org_id
                )
            )
            if sub and sub.status in (
                SubscriptionStatus.SUSPENDED,
                SubscriptionStatus.CANCELLED,
            ):
                return JSONResponse(
                    status_code=403,
                    content={
                        "error": {
                            "code": "SUBSCRIPTION_INACTIVE",
                            "message": f"Organization subscription is {sub.status.value}",
                        }
                    },
                )

            svc = LicenseService(db)
            if not svc.enforcement_enabled():
                return await call_next(request)

            evaluation = svc.evaluate_for_organization(org_id)
            if evaluation.access_mode == LicenseAccessMode.FULL:
                return await call_next(request)

            code = "LICENSE_READ_ONLY"
            if evaluation.access_mode == LicenseAccessMode.UNLICENSED:
                code = "LICENSE_INVALID"
            elif evaluation.access_mode == LicenseAccessMode.NOT_STARTED:
                code = "LICENSE_NOT_STARTED"
            elif evaluation.effective_status and evaluation.effective_status.value == "REVOKED":
                code = "LICENSE_REVOKED"

            return JSONResponse(
                status_code=403,
                content={
                    "error": {
                        "code": code,
                        "message": evaluation.message
                        or "ADORA license prevents this operation.",
                        "access_mode": evaluation.access_mode.value,
                        "effective_status": (
                            evaluation.effective_status.value
                            if evaluation.effective_status
                            else None
                        ),
                    }
                },
            )
