from fastapi import APIRouter

from app.api.v1 import (
    auth,
    business_functions,
    configuration,
    controls,
    database,
    evidence,
    extensions,
    organizations,
    risks,
    regulatory,
    stubs,
    suppliers,
)

api_v1_router = APIRouter()
api_v1_router.include_router(auth.router)
api_v1_router.include_router(organizations.router)
api_v1_router.include_router(business_functions.router)
api_v1_router.include_router(suppliers.router)
api_v1_router.include_router(controls.router)
api_v1_router.include_router(risks.router)
api_v1_router.include_router(evidence.router)
api_v1_router.include_router(configuration.router)
api_v1_router.include_router(extensions.router)
api_v1_router.include_router(regulatory.router)
api_v1_router.include_router(database.router)
api_v1_router.include_router(stubs.router)
