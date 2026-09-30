"""Simple in-memory rate limiting (single-instance; document for multi-replica upgrade)."""

from __future__ import annotations

import time
from collections import defaultdict, deque

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

_BUCKETS: dict[str, deque[float]] = defaultdict(deque)


def _client_key(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app,
        *,
        max_requests: int = 120,
        window_seconds: int = 60,
        paths: tuple[str, ...] = ("/api/v1/auth/login", "/graphql"),
    ) -> None:
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.paths = paths

    async def dispatch(self, request: Request, call_next):
        import os

        if os.getenv("DISABLE_RATE_LIMIT", "").lower() in ("1", "true", "yes", "on"):
            return await call_next(request)
        path = request.url.path
        if not any(path.startswith(p) for p in self.paths):
            return await call_next(request)
        key = f"{path}:{_client_key(request)}"
        now = time.monotonic()
        bucket = _BUCKETS[key]
        while bucket and now - bucket[0] > self.window_seconds:
            bucket.popleft()
        if len(bucket) >= self.max_requests:
            return JSONResponse(
                status_code=429,
                content={"error": {"code": "RATE_LIMIT", "message": "Too many requests"}},
            )
        bucket.append(now)
        return await call_next(request)
