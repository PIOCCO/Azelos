import os
import signal
from contextlib import asynccontextmanager

import psycopg
import redis
from fastapi import FastAPI, HTTPException


@asynccontextmanager
async def lifespan(_app: FastAPI):
    yield


app = FastAPI(lifespan=lifespan)


@app.get("/health")
def health():
    db_ok = True
    redis_ok = True
    if os.getenv("DATABASE_URL"):
        try:
            with psycopg.connect(os.environ["DATABASE_URL"]) as conn:
                conn.execute("SELECT 1")
        except Exception:
            db_ok = False
    if os.getenv("REDIS_URL"):
        try:
            r = redis.from_url(os.environ["REDIS_URL"])
            redis_ok = r.ping()
        except Exception:
            redis_ok = False
    if not db_ok or not redis_ok:
        raise HTTPException(status_code=503, detail="dependency_unhealthy")
    return {"status": "ok", "service": "python-api"}


@app.get("/api/catalog")
def catalog():
    return {"products": [{"id": 1, "name": "sample"}]}


def handle_sigterm(*_args):
    raise SystemExit(0)


signal.signal(signal.SIGTERM, handle_sigterm)
