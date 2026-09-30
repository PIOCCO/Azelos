from fastapi import APIRouter

from app.api.v1 import (
    applicability,
    auth,
    business_functions,
    configuration,
    contracts,
    controls,
    database,
    evidence,
    extensions,
    ict_assets,
    ict_services,
    information_assets,
    modules,
    organizations,
    profiles,
    providers,
    regulatory_requirements,
    requirements,
    risks,
    stubs,
    sub_outsourcing,
    cloud_accounts,
    cloud_resources,
    business_services,
    resilience_ops,
    dora_overview,
)

api_v1_router = APIRouter()
api_v1_router.include_router(auth.router)
api_v1_router.include_router(organizations.router)
api_v1_router.include_router(profiles.router)
api_v1_router.include_router(applicability.router)
api_v1_router.include_router(modules.router)
api_v1_router.include_router(requirements.router)
api_v1_router.include_router(providers.router)
api_v1_router.include_router(contracts.router)
api_v1_router.include_router(ict_services.router)
api_v1_router.include_router(sub_outsourcing.router)
api_v1_router.include_router(information_assets.router)
api_v1_router.include_router(business_functions.router)
api_v1_router.include_router(ict_assets.router)
api_v1_router.include_router(controls.router)
api_v1_router.include_router(risks.router)
api_v1_router.include_router(evidence.router)
api_v1_router.include_router(configuration.router)
api_v1_router.include_router(extensions.router)
api_v1_router.include_router(regulatory_requirements.router)
api_v1_router.include_router(database.router)
api_v1_router.include_router(stubs.router)
api_v1_router.include_router(cloud_accounts.router)
api_v1_router.include_router(cloud_resources.router)
api_v1_router.include_router(business_services.router)
api_v1_router.include_router(resilience_ops.router)
api_v1_router.include_router(dora_overview.router)
