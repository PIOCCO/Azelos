from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.config import settings
from app.core.security import hash_password
from app.db.session import SessionLocal, init_db
from app.models.entities import Department, Role, Tenant, User
from app.services.storage import ensure_bucket


def seed():
    db = SessionLocal()
    try:
        if not db.get(Tenant, settings.tenant_id):
            db.add(Tenant(id=settings.tenant_id, name="Default Tenant"))
        from sqlalchemy import select

        if not db.scalar(select(User.id).where(User.email == "admin@company.local")):
            db.add(
                User(
                    tenant_id=settings.tenant_id,
                    email="admin@company.local",
                    hashed_password=hash_password("admin123!"),
                    full_name="System Admin",
                    role=Role.SUPER_ADMIN,
                )
            )
        db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    try:
        ensure_bucket()
    except Exception:
        pass
    seed()
    yield


app = FastAPI(title="Private AI Cloud API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router, prefix="/api/v1")
