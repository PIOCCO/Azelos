from fastapi import FastAPI

from app.api.routes.config import router as config_router

app = FastAPI(title="Azelos DORA Blueprint — Configuration API", version="0.2.0")
app.include_router(config_router)


@app.get("/health")
def health():
    return {"status": "ok"}
