from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.config import settings
from app.core.security import hash_password
from app.db.session import SessionLocal, init_db
from app.models.entities import Tenant, User, UserRole
from app.services.sync_pipeline import run_full_sync


def seed() -> None:
    db = SessionLocal()
    try:
        if not db.get(Tenant, "tenant-demo"):
            db.add(
                Tenant(
                    id="tenant-demo",
                    name="Demo Company",
                    azure_subscription_id=settings.azure_subscription_id or "demo-sub",
                )
            )
        if not db.get(Tenant, "tenant-b"):
            db.add(Tenant(id="tenant-b", name="Company B", azure_subscription_id="demo-sub-b"))
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
        if settings.azure_mock:
            run_full_sync(db, "tenant-demo")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    if settings.app_env != "test":
        init_db()
        seed()
    yield


app = FastAPI(title="Azure Managed Resilience API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router, prefix="/api/v1")
