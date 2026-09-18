"""Central permission evaluation — used before any retrieval."""

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.entities import Document, DocumentPermission, Role, User


def user_can_access_document(user: User, document_id: str, db: Session) -> bool:
    return document_id in get_accessible_document_ids(user, db)


def get_accessible_document_ids(user: User, db: Session) -> set[str]:
    if user.role in {Role.SUPER_ADMIN, Role.ADMIN}:
        rows = db.scalars(select(Document.id).where(Document.tenant_id == user.tenant_id))
        return set(rows.all())

    stmt = (
        select(DocumentPermission.document_id)
        .join(Document, Document.id == DocumentPermission.document_id)
        .where(Document.tenant_id == user.tenant_id)
        .where(
            or_(
                DocumentPermission.user_id == user.id,
                DocumentPermission.department_id == user.department_id,
                DocumentPermission.role == user.role,
            )
        )
    )
    return set(db.scalars(stmt).all())
