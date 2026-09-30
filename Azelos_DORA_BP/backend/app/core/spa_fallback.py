"""Serve built React SPA: static assets + index.html for client-side routes."""

from __future__ import annotations

import logging
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

logger = logging.getLogger(__name__)

# Paths that must never return index.html (backend / docs / health).
_API_PREFIXES = ("api/", "graphql")
_API_EXACT = frozenset({"health", "ready", "docs", "openapi.json", "redoc"})


def _is_backend_path(path: str) -> bool:
    normalized = path.lstrip("/")
    if normalized in _API_EXACT:
        return True
    return any(normalized.startswith(p) for p in _API_PREFIXES)


def register_spa_routes(app: FastAPI, dist: Path) -> None:
    """Register after all API routes. Does not intercept /api or /graphql."""
    index_path = dist / "index.html"
    if not index_path.is_file():
        raise FileNotFoundError(index_path)

    assets = dist / "assets"
    if assets.is_dir():
        app.mount("/assets", StaticFiles(directory=assets), name="frontend-assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa_serve(full_path: str = ""):
        if _is_backend_path(full_path):
            raise HTTPException(status_code=404, detail="Not Found")
        if full_path:
            candidate = dist / full_path
            if candidate.is_file():
                return FileResponse(candidate)
        return FileResponse(index_path)

    logger.info("SPA fallback registered from %s", dist)
