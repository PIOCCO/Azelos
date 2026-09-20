"""Locate Tesseract OCR binary (Windows-first)."""

from __future__ import annotations

import os
import shutil
import sys

import pytesseract

INSTALL_HELP = """
Tesseract OCR is not installed or not found.

Windows:
  1. Download installer: https://github.com/UB-Mannheim/tesseract/wiki
  2. Run the .exe (default: C:\\Program Files\\Tesseract-OCR)
  3. Optional: check "Add to PATH" during setup
  4. Restart this app

Or set environment variable before running:
  set TESSERACT_CMD=C:\\Program Files\\Tesseract-OCR\\tesseract.exe

Linux:
  sudo apt install tesseract-ocr
"""


def _candidates() -> list[str]:
    env = os.environ.get("TESSERACT_CMD") or os.environ.get("TESSERACT_PATH")
    if env:
        yield env
    found = shutil.which("tesseract")
    if found:
        yield found
    if sys.platform == "win32":
        for path in (
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
            os.path.expandvars(r"%LocalAppData%\Programs\Tesseract-OCR\tesseract.exe"),
        ):
            yield path


def configure_tesseract() -> str | None:
    """Set pytesseract command if found. Returns path or None."""
    for path in _candidates():
        if path and os.path.isfile(path):
            pytesseract.pytesseract.tesseract_cmd = path
            return path
    return None


def require_tesseract() -> str:
    path = configure_tesseract()
    if path:
        return path
    raise FileNotFoundError(INSTALL_HELP.strip())


def is_tesseract_available() -> bool:
    return configure_tesseract() is not None
