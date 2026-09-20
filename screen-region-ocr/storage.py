"""Append capture results to a text file."""

from __future__ import annotations

from pathlib import Path


def append_capture(path: str, text: str) -> int:
    """
    Append structured text to path. Each capture ends with a newline.
    Multi-line results keep internal line breaks; one trailing newline after the block.
    Returns number of bytes written.
    """
    if not path or not text.strip():
        return 0
    p = Path(path.strip())
    p.parent.mkdir(parents=True, exist_ok=True)
    block = text.rstrip() + "\n"
    with p.open("a", encoding="utf-8", newline="\n") as f:
        n = f.write(block)
    return n
