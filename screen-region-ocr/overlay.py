"""Always-on-top selection rectangle (Windows-friendly tkinter)."""

from __future__ import annotations

import sys
import tkinter as tk
from typing import Callable

from capture import ScreenRect

try:
    import ctypes

    if sys.platform == "win32":
        ctypes.windll.shcore.SetProcessDpiAwareness(2)  # Per-monitor DPI aware
except Exception:
    pass

MIN_W, MIN_H = 80, 40
HANDLE = 8
BORDER = 2


class SelectionOverlay:
    """
    Transparent fill with visible red border; drag inside to move, handles to resize.
    """

    def __init__(
        self,
        master: tk.Misc | None = None,
        on_change: Callable[[ScreenRect], None] | None = None,
    ) -> None:
        self.on_change = on_change
        self.root = tk.Toplevel(master) if master else tk.Tk()
        self.root.title("Region")
        self.root.overrideredirect(True)
        self.root.attributes("-topmost", True)
        if sys.platform == "win32":
            self.root.attributes("-transparentcolor", "magenta")
        self.root.configure(bg="magenta")

        self.canvas = tk.Canvas(self.root, highlightthickness=0, bg="magenta", cursor="fleur")
        self.canvas.pack(fill=tk.BOTH, expand=True)

        sw = self.root.winfo_screenwidth()
        sh = self.root.winfo_screenheight()
        w, h = max(320, sw // 4), max(180, sh // 5)
        x, y = (sw - w) // 2, (sh - h) // 3
        self.root.geometry(f"{w}x{h}+{x}+{y}")

        self._drag_mode: str | None = None
        self._drag_start: tuple[int, int, int, int, int, int] | None = None  # x,y, wx, wy, ww, wh

        self.canvas.bind("<ButtonPress-1>", self._on_press)
        self.canvas.bind("<B1-Motion>", self._on_motion)
        self.canvas.bind("<ButtonRelease-1>", self._on_release)
        self.root.bind("<Configure>", lambda _e: self._redraw())

        self._redraw()
        self._emit()

    def show(self) -> None:
        self.root.deiconify()
        self.root.lift()

    def hide(self) -> None:
        self.root.withdraw()

    def get_rect(self) -> ScreenRect:
        self.root.update_idletasks()
        x = self.root.winfo_rootx()
        y = self.root.winfo_rooty()
        w = self.root.winfo_width()
        h = self.root.winfo_height()
        return ScreenRect(int(x), int(y), int(w), int(h))

    def run_async(self) -> None:
        """Non-blocking tick for use with control panel mainloop."""
        self.root.update()

    def mainloop(self) -> None:
        self.root.mainloop()

    def _emit(self) -> None:
        if self.on_change:
            self.on_change(self.get_rect())

    def _redraw(self) -> None:
        self.canvas.delete("all")
        w = max(MIN_W, self.canvas.winfo_width())
        h = max(MIN_H, self.canvas.winfo_height())
        # Transparent interior
        self.canvas.create_rectangle(0, 0, w, h, fill="magenta", outline="", width=0)
        # Visible border
        self.canvas.create_rectangle(
            BORDER,
            BORDER,
            w - BORDER,
            h - BORDER,
            outline="#e53935",
            width=BORDER,
        )
        # Resize handles
        for hx, hy, tag in self._handle_positions(w, h):
            self.canvas.create_rectangle(
                hx,
                hy,
                hx + HANDLE,
                hy + HANDLE,
                fill="#e53935",
                outline="white",
                width=1,
                tags=("handle", tag),
            )

    def _handle_positions(self, w: int, h: int) -> list[tuple[int, int, str]]:
        m = HANDLE // 2
        return [
            (0, 0, "nw"),
            (w // 2 - m, 0, "n"),
            (w - HANDLE, 0, "ne"),
            (w - HANDLE, h // 2 - m, "e"),
            (w - HANDLE, h - HANDLE, "se"),
            (w // 2 - m, h - HANDLE, "s"),
            (0, h - HANDLE, "sw"),
            (0, h // 2 - m, "w"),
        ]

    def _hit_handle(self, x: int, y: int) -> str | None:
        w = self.canvas.winfo_width()
        h = self.canvas.winfo_height()
        for hx, hy, tag in self._handle_positions(w, h):
            if hx <= x <= hx + HANDLE and hy <= y <= hy + HANDLE:
                return tag
        return None

    def _on_press(self, event) -> None:
        tag = self._hit_handle(event.x, event.y)
        self._drag_mode = tag if tag else "move"
        wx, wy = self.root.winfo_x(), self.root.winfo_y()
        ww, wh = self.root.winfo_width(), self.root.winfo_height()
        self._drag_start = (event.x_root, event.y_root, wx, wy, ww, wh)

    def _on_motion(self, event) -> None:
        if not self._drag_start or not self._drag_mode:
            return
        sx, sy, wx, wy, ww, wh = self._drag_start
        dx = event.x_root - sx
        dy = event.y_root - sy
        mode = self._drag_mode

        if mode == "move":
            self.root.geometry(f"{ww}x{wh}+{wx + dx}+{wy + dy}")
        else:
            left, top, right, bottom = wx, wy, wx + ww, wy + wh
            if "w" in mode:
                left = min(left + dx, right - MIN_W)
            if "e" in mode:
                right = max(right + dx, left + MIN_W)
            if "n" in mode:
                top = min(top + dy, bottom - MIN_H)
            if "s" in mode:
                bottom = max(bottom + dy, top + MIN_H)
            nw, nh = right - left, bottom - top
            self.root.geometry(f"{int(nw)}x{int(nh)}+{int(left)}+{int(top)}")
            self._drag_start = (event.x_root, event.y_root, left, top, nw, nh)

        self._redraw()
        self._emit()

    def _on_release(self, _event) -> None:
        self._drag_mode = None
        self._drag_start = None
        self._emit()
