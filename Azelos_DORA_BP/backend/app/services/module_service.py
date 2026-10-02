from uuid import UUID

from sqlalchemy.orm import Session

from app.schemas.applicability import ModuleApplicabilityOut
from app.services.applicability import ApplicabilityService
from app.services.org_module_defaults import ensure_default_module_assignments


class ModuleService:
    def __init__(self, db: Session, organization_id: UUID) -> None:
        self.db = db
        self.organization_id = organization_id

    def list_for_organization(self) -> list[ModuleApplicabilityOut]:
        ensure_default_module_assignments(self.db, self.organization_id)
        return ApplicabilityService(self.db, self.organization_id).build_response().modules
