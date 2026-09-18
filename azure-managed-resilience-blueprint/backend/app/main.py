import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.api.routes import router
from app.core.config import settings, validate_production_settings
from app.core.exceptions import AppError, app_error_handler, unhandled_error_handler
from app.core.security import hash_password
from app.db.session import SessionLocal, init_db
from app.middleware.rate_limit import SimpleRateLimitMiddleware
from app.middleware.request_context import RequestContextMiddleware
from app.models.entities import Tenant, User, UserRole
from app.services.sync_engine import run_full_sync


def seed() -> None:
    if settings.is_production:
        return
    db = SessionLocal()
    try:
        if not db.get(Tenant, "tenant-demo"):
            db.add(
                Tenant(
                    id="tenant-demo",
                    name="Example Company",
                    azure_subscription_id=settings.azure_subscription_id or "",
                )
            )
        if not db.get(Tenant, "tenant-b"):
            db.add(Tenant(id="tenant-b", name="Northwind Traders", azure_subscription_id=""))
        if not db.query(User).filter(User.email == settings.dev_provider_email).first():
            db.add(
                User(
                    email=settings.dev_provider_email,
                    hashed_password=hash_password(settings.dev_provider_password),
                    role=UserRole.PROVIDER_ADMIN,
                    tenant_id=None,
                )
            )
        if not db.query(User).filter(User.email == "customer@example.com").first():
            db.add(
                User(
                    email="customer@example.com",
                    hashed_password=hash_password("Customer123!"),
                    role=UserRole.CUSTOMER_ADMIN,
                    tenant_id="tenant-demo",
                )
            )
        if not db.query(User).filter(User.email == "viewer@example.com").first():
            db.add(
                User(
                    email="viewer@example.com",
                    hashed_password=hash_password("Viewer123!"),
                    role=UserRole.CUSTOMER_VIEWER,
                    tenant_id="tenant-demo",
                )
            )
        db.commit()
        if settings.demo_mode and settings.app_env != "test":
            run_full_sync(db, "tenant-demo")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    validate_production_settings()
    if settings.app_env != "test":
        init_db()
        seed()
    yield


logging.basicConfig(level=logging.INFO, format="%(message)s")

app = FastAPI(title=settings.product_name, lifespan=lifespan)
app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(Exception, unhandled_error_handler)
app.add_middleware(RequestContextMiddleware)
app.add_middleware(SimpleRateLimitMiddleware)
if settings.trusted_hosts != "*":
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.trusted_hosts.split(","))
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list if settings.is_production else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router, prefix="/api/v1")
