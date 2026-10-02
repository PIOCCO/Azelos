"""PDF upload validation (content-based, not filename-only)."""

from app.core.exceptions import AppError

PDF_MAGIC = b"%PDF-"
MAX_PDF_BYTES = 25 * 1024 * 1024


def validate_pdf_upload(content: bytes, filename: str) -> None:
    if not filename or not filename.strip():
        raise AppError("VALIDATION", "Filename required", 400)
    name = filename.strip()
    if ".." in name or "/" in name or "\\" in name or name.startswith("."):
        raise AppError("VALIDATION", "Invalid filename", 400)
    if not name.lower().endswith(".pdf"):
        raise AppError("VALIDATION", "Only PDF files are allowed", 400)
    if len(content) == 0:
        raise AppError("VALIDATION", "Empty file", 400)
    if len(content) > MAX_PDF_BYTES:
        raise AppError("VALIDATION", "File exceeds 25MB limit", 400)
    if not content.startswith(PDF_MAGIC):
        raise AppError("VALIDATION", "File is not a valid PDF", 400)
    if b"%%EOF" not in content[-4096:] and b"%%EOF" not in content:
        raise AppError("VALIDATION", "Corrupted or incomplete PDF", 400)
