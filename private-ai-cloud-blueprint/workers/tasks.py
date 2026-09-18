from app.db.session import SessionLocal
from app.services.ingestion import process_document
from workers.celery_app import celery


@celery.task(name="workers.tasks.process_document")
def process_document_task(document_id: str) -> None:
    db = SessionLocal()
    try:
        process_document(db, document_id)
    finally:
        db.close()
