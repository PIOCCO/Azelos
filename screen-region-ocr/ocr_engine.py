"""OCR with OpenCV preprocessing."""

from __future__ import annotations

import cv2
import numpy as np
import pytesseract
from PIL import Image

from tesseract_setup import configure_tesseract, require_tesseract

configure_tesseract()


def preprocess_for_ocr(pil_image: Image.Image, scale: float = 2.0) -> np.ndarray:
    img = np.array(pil_image.convert("RGB"))
    img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
    if scale != 1.0:
        img = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.bilateralFilter(gray, 9, 75, 75)
    # Adaptive contrast (CLAHE)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    gray = clahe.apply(gray)
    # Sharpen slightly
    kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
    gray = cv2.filter2D(gray, -1, kernel)
    _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return binary


def run_ocr(pil_image: Image.Image, *, lang: str = "eng") -> str:
    require_tesseract()
    processed = preprocess_for_ocr(pil_image)
    config = "--psm 6 -c preserve_interword_spaces=1"
    text = pytesseract.image_to_string(processed, lang=lang, config=config)
    return normalize_ocr_text(text)


def normalize_ocr_text(text: str) -> str:
    lines = [ln.rstrip() for ln in text.replace("\r\n", "\n").split("\n")]
    # Drop empty trailing lines but preserve internal blank lines sparingly
    while lines and not lines[-1].strip():
        lines.pop()
    return "\n".join(lines)
