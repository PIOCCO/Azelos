"""Clipboard and keyboard automation (lazy imports — safe on headless until Type is used)."""

from __future__ import annotations

import os
import time

import pyperclip


def copy_to_clipboard(text: str) -> None:
    pyperclip.copy(text)


def _pyautogui():
    if not os.environ.get("DISPLAY") and os.name != "nt":
        raise RuntimeError(
            "No graphical session (DISPLAY is unset). "
            "Run this app on Windows, or on Linux with a desktop (Wayland/X11), not over plain SSH. "
            "Copy still works if the clipboard tool is installed (xclip/wl-clipboard)."
        )
    import pyautogui

    pyautogui.FAILSAFE = True
    pyautogui.PAUSE = 0.05
    return pyautogui


def type_into_focused_field(text: str, *, use_paste: bool = True) -> None:
    """
    Types into the currently focused control.
    Default: paste via Ctrl+V (preserves line breaks and unicode better than typewrite).
    """
    if not text:
        return
    copy_to_clipboard(text)
    time.sleep(0.15)
    pg = _pyautogui()
    if use_paste:
        pg.hotkey("ctrl", "v")
    else:
        pg.write(text, interval=0.02)
