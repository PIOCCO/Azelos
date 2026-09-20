"""Clipboard and keyboard automation (Windows-friendly)."""

from __future__ import annotations

import time

import pyautogui
import pyperclip

# Fail-safe: move mouse to corner to abort
pyautogui.FAILSAFE = True
pyautogui.PAUSE = 0.05


def copy_to_clipboard(text: str) -> None:
    pyperclip.copy(text)


def type_into_focused_field(text: str, *, use_paste: bool = True) -> None:
    """
    Types into the currently focused control.
    Default: paste via Ctrl+V (preserves line breaks and unicode better than typewrite).
    """
    if not text:
        return
    copy_to_clipboard(text)
    time.sleep(0.15)
    if use_paste:
        pyautogui.hotkey("ctrl", "v")
    else:
        pyautogui.write(text, interval=0.02)
