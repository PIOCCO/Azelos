import time
from collections import defaultdict

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.core.config import settings


class SimpleRateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self._hits: dict[str, list[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        if request.url.path.endswith("/health") or request.url.path.endswith("/ready"):
            return await call_next(request)
        ip = request.client.host if request.client else "unknown"
        now = time.time()
        window = self._hits[ip]
        window[:] = [t for t in window if now - t < 60]
        if len(window) >= settings.rate_limit_per_minute:
            return JSONResponse(status_code=429, content={"error": {"code": "rate_limited", "message": "Too many requests"}})
        window.append(now)
        return await call_next(request)
