from uuid import UUID

from sqlalchemy.orm import Session


class OrgScopedRepository:
    def __init__(self, db: Session, organization_id: UUID) -> None:
        self.db = db
        self.organization_id = organization_id
