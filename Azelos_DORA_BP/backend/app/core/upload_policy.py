"""Evidence upload allowlists."""

import os
import re

from app.core.exceptions import AppError

_SAFE_BASENAME = re.compile(r"[^A-Za-z0-9._ -]+")

BLOCKED_EXTENSIONS = {
    ".exe",
    ".bat",
    ".cmd",
    ".sh",
    ".ps1",
    ".js",
    ".html",
    ".htm",
    ".svg",
    ".dll",
    ".msi",
}

ALLOWED_MIME_PREFIXES = (
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument",
    "application/vnd.ms-",
    "text/plain",
    "text/csv",
    "image/png",
    "image/jpeg",
    "application/json",
    "application/zip",
    "application/x-zip-compressed",
)


def sanitize_upload_basename(filename: str) -> str:
    base = os.path.basename(filename.replace("\\", "/")).strip()
    if not base or base in {".", ".."}:
        raise AppError("VALIDATION", "Invalid filename", 400)
    if ".." in base:
        raise AppError("VALIDATION", "Invalid filename", 400)
    cleaned = _SAFE_BASENAME.sub("_", base).strip("._ ")
    if not cleaned:
        raise AppError("VALIDATION", "Invalid filename", 400)
    return cleaned[:255]


def validate_upload_filename(filename: str) -> None:
    sanitize_upload_basename(filename)
    lower = filename.lower()
    for ext in BLOCKED_EXTENSIONS:
        if lower.endswith(ext):
            raise AppError("VALIDATION", f"File type not allowed: {ext}", 400)


def validate_upload_content_type(content_type: str | None) -> None:
    if not content_type:
        return
    ct = content_type.split(";")[0].strip().lower()
    if any(ct.startswith(p) for p in ALLOWED_MIME_PREFIXES):
        return
    raise AppError("VALIDATION", f"Content type not allowed: {content_type}", 400)
