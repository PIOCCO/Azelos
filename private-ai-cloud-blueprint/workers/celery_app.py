from celery import Celery

from app.core.config import settings

celery = Celery("paic", broker=settings.redis_url, backend=settings.redis_url)
celery.conf.task_routes = {"workers.tasks.*": {"queue": "ingestion"}}
