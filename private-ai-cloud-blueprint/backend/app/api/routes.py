import json
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, EmailStr
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.core.config import settings
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models.entities import (
    AuditAction,
    Conversation,
    Department,
    Document,
    DocumentPermission,
    Message,
    ProcessingStatus,
    Role,
    User,
)
from app.services.audit import log_audit
from app.services.ingestion import create_upload_version, process_document
from app.services.permissions import get_accessible_document_ids
from app.services.rag import build_citations, generate_answer, permission_filtered_search

router = APIRouter()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class DepartmentCreate(BaseModel):
    name: str


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: Role = Role.EMPLOYEE
    department_id: str | None = None


class PermissionUpdate(BaseModel):
    department_ids: list[str] = []
    user_ids: list[str] = []


class ChatRequest(BaseModel):
    conversation_id: str | None = None
    message: str


@router.post("/auth/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == body.email))
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(user.id, {"role": user.role.value, "tenant_id": user.tenant_id})
    log_audit(db, tenant_id=user.tenant_id, user_id=user.id, action=AuditAction.LOGIN)
    return TokenResponse(access_token=token)


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/ready")
def ready(db: Session = Depends(get_db)):
    db.execute(select(func.now()))
    return {"status": "ready"}


@router.post("/admin/departments")
def create_department(
    body: DepartmentCreate,
    user: User = Depends(require_roles(Role.ADMIN, Role.SUPER_ADMIN)),
    db: Session = Depends(get_db),
):
    dept = Department(tenant_id=user.tenant_id, name=body.name)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return {"id": dept.id, "name": dept.name}


@router.post("/admin/users")
def create_user(
    body: UserCreate,
    user: User = Depends(require_roles(Role.ADMIN, Role.SUPER_ADMIN)),
    db: Session = Depends(get_db),
):
    u = User(
        tenant_id=user.tenant_id,
        email=body.email,
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
        role=body.role,
        department_id=body.department_id,
    )
    db.add(u)
    db.commit()
    log_audit(db, tenant_id=user.tenant_id, user_id=user.id, action=AuditAction.USER_CREATED, resource_id=u.id)
    return {"id": u.id, "email": u.email}


@router.get("/documents")
def list_documents(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role in {Role.ADMIN, Role.SUPER_ADMIN}:
        docs = db.scalars(select(Document).where(Document.tenant_id == user.tenant_id)).all()
    else:
        allowed = get_accessible_document_ids(user, db)
        docs = db.scalars(select(Document).where(Document.id.in_(allowed))).all() if allowed else []
    return [
        {
            "id": d.id,
            "filename": d.filename,
            "status": d.processing_status.value,
            "department_id": d.department_id,
            "version": d.active_version,
        }
        for d in docs
    ]


@router.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    department_id: str | None = Form(None),
    user: User = Depends(require_roles(Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER)),
    db: Session = Depends(get_db),
):
    ext = Path(file.filename or "").suffix.lower().lstrip(".")
    allowed = {x.strip() for x in settings.allowed_file_types.split(",")}
    if ext not in allowed:
        raise HTTPException(status_code=400, detail="File type not allowed")
    data = await file.read()
    if len(data) > settings.max_file_size_mb * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large")

    doc = Document(
        tenant_id=user.tenant_id,
        filename=file.filename,
        mime_type=file.content_type or "application/octet-stream",
        size=len(data),
        department_id=department_id,
        uploaded_by=user.id,
        processing_status=ProcessingStatus.UPLOADED,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    key = f"{user.tenant_id}/{doc.id}/v{doc.active_version}/{file.filename}"
    create_upload_version(db, doc, data, key)
    log_audit(db, tenant_id=user.tenant_id, user_id=user.id, action=AuditAction.DOCUMENT_UPLOAD, resource_id=doc.id)

    if settings.app_env == "test":
        process_document(db, doc.id)
    else:
        from workers.tasks import process_document_task

        process_document_task.delay(doc.id)

    return {"document_id": doc.id, "status": doc.processing_status.value}


@router.put("/documents/{document_id}/permissions")
def update_permissions(
    document_id: str,
    body: PermissionUpdate,
    user: User = Depends(require_roles(Role.ADMIN, Role.SUPER_ADMIN)),
    db: Session = Depends(get_db),
):
    doc = db.get(Document, document_id)
    if not doc or doc.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Not found")
    db.query(DocumentPermission).filter(DocumentPermission.document_id == document_id).delete()
    for dept_id in body.department_ids:
        db.add(DocumentPermission(document_id=document_id, department_id=dept_id))
    for uid in body.user_ids:
        db.add(DocumentPermission(document_id=document_id, user_id=uid))
    db.commit()
    log_audit(db, tenant_id=user.tenant_id, user_id=user.id, action=AuditAction.PERMISSION_CHANGE, resource_id=document_id)
    return {"ok": True}


@router.delete("/documents/{document_id}")
def delete_document(
    document_id: str,
    user: User = Depends(require_roles(Role.ADMIN, Role.SUPER_ADMIN)),
    db: Session = Depends(get_db),
):
    from sqlalchemy import update
    from app.models.entities import DocumentChunk

    doc = db.get(Document, document_id)
    if not doc or doc.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Not found")
    db.execute(update(DocumentChunk).where(DocumentChunk.document_id == document_id).values(is_active=False))
    db.delete(doc)
    db.commit()
    log_audit(db, tenant_id=user.tenant_id, user_id=user.id, action=AuditAction.DOCUMENT_DELETE, resource_id=document_id)
    return {"deleted": True}


@router.post("/chat/query")
def chat_query(body: ChatRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conv_id = body.conversation_id
    if not conv_id:
        conv = Conversation(tenant_id=user.tenant_id, user_id=user.id, title=body.message[:80])
        db.add(conv)
        db.commit()
        db.refresh(conv)
        conv_id = conv.id
    else:
        conv = db.get(Conversation, conv_id)
        if not conv or conv.user_id != user.id:
            raise HTTPException(status_code=404, detail="Conversation not found")

    db.add(Message(conversation_id=conv_id, role="user", content=body.message))
    db.commit()

    chunks = permission_filtered_search(db, user, body.message)
    answer = generate_answer(body.message, chunks)
    citations = build_citations(chunks)

    db.add(Message(conversation_id=conv_id, role="assistant", content=answer, citations_json=json.dumps(citations)))
    db.commit()

    log_audit(
        db,
        tenant_id=user.tenant_id,
        user_id=user.id,
        action=AuditAction.AI_QUERY,
        metadata={"conversation_id": conv_id, "retrieved_document_ids": list({c["document_id"] for c in chunks})},
    )
    log_audit(db, tenant_id=user.tenant_id, user_id=user.id, action=AuditAction.AI_RESPONSE, metadata={"conversation_id": conv_id})

    return {"conversation_id": conv_id, "answer": answer, "citations": citations}


@router.get("/admin/usage")
def admin_usage(user: User = Depends(require_roles(Role.ADMIN, Role.SUPER_ADMIN)), db: Session = Depends(get_db)):
    from app.models.entities import AuditLog

    q_count = db.scalar(
        select(func.count()).select_from(AuditLog).where(
            AuditLog.tenant_id == user.tenant_id, AuditLog.action == AuditAction.AI_QUERY
        )
    )
    doc_count = db.scalar(select(func.count()).select_from(Document).where(Document.tenant_id == user.tenant_id))
    indexed = db.scalar(
        select(func.count()).select_from(Document).where(
            Document.tenant_id == user.tenant_id, Document.processing_status == ProcessingStatus.INDEXED
        )
    )
    return {"queries_total": q_count, "documents_total": doc_count, "indexed_documents": indexed}


@router.get("/audit")
def audit_logs(user: User = Depends(require_roles(Role.ADMIN, Role.SUPER_ADMIN)), db: Session = Depends(get_db)):
    from app.models.entities import AuditLog

    rows = db.scalars(select(AuditLog).where(AuditLog.tenant_id == user.tenant_id).order_by(AuditLog.created_at.desc()).limit(100))
    return [
        {"action": r.action.value, "user_id": r.user_id, "resource_id": r.resource_id, "created_at": r.created_at.isoformat()}
        for r in rows
    ]
