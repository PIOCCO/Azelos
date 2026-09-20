#!/usr/bin/env python3
"""
Screen region OCR — Windows desktop tool.

Move/resize the red overlay, Capture, refine with an instruction, Copy or Type.
"""

from __future__ import annotations

import os
import sys

if not os.environ.get("DISPLAY") and sys.platform != "win32":
    print(
        "Error: no DISPLAY (no graphical desktop).\n"
        "  • Use Windows, or Linux/macOS with a desktop session.\n"
        "  • SSH: enable X11 forwarding (ssh -X) or run locally on the machine.\n"
        "  • WSL: use WSLg, or run from Windows Python instead.",
        file=sys.stderr,
    )
    sys.exit(1)

import tkinter as tk
from tkinter import messagebox, scrolledtext, ttk

from automation import copy_to_clipboard, type_into_focused_field
from capture import ScreenRect, grab_region
from extractors import extract
from ocr_engine import run_ocr
from overlay import SelectionOverlay
from tesseract_setup import INSTALL_HELP, is_tesseract_available, require_tesseract

INSTRUCTION_HINT = (
    'Examples: "all", "emails", "Extract only student names", '
    '"names and roles", "regex:^\\d+\\s+(.+)$"'
)


class ControlPanel:
    def __init__(self) -> None:
        self.root = tk.Tk()
        self.root.title("Screen Region OCR")
        self.root.minsize(420, 520)
        self.root.geometry("480x560")

        self.last_rect: ScreenRect | None = None
        self.raw_ocr = ""
        self.result_text = ""

        self._build_ui()
        self.overlay = SelectionOverlay(self.root, on_change=self._on_region_change)
        self._poll_overlay()
        self.root.after(200, self._check_tesseract)

    def _build_ui(self) -> None:
        pad = {"padx": 8, "pady": 4}
        frm = ttk.Frame(self.root, padding=8)
        frm.pack(fill=tk.BOTH, expand=True)

        ttk.Label(frm, text="Selection overlay", font=("Segoe UI", 10, "bold")).grid(row=0, column=0, sticky="w", **pad)
        ttk.Label(
            frm,
            text="Drag the red frame over the screen area. Resize with corner/edge handles.",
            wraplength=440,
        ).grid(row=1, column=0, sticky="w", **pad)

        btn_row = ttk.Frame(frm)
        btn_row.grid(row=2, column=0, sticky="ew", **pad)
        ttk.Button(btn_row, text="Show overlay", command=self._show_overlay).pack(side=tk.LEFT, padx=2)
        ttk.Button(btn_row, text="Hide overlay", command=self._hide_overlay).pack(side=tk.LEFT, padx=2)

        self.region_var = tk.StringVar(value="Region: (move overlay)")
        ttk.Label(frm, textvariable=self.region_var, font=("Consolas", 9)).grid(row=3, column=0, sticky="w", **pad)

        ttk.Separator(frm).grid(row=4, column=0, sticky="ew", pady=8)

        ttk.Label(frm, text="What to extract").grid(row=5, column=0, sticky="w", **pad)
        self.instruction = ttk.Entry(frm)
        self.instruction.insert(0, "all")
        self.instruction.grid(row=6, column=0, sticky="ew", **pad)
        ttk.Label(frm, text=INSTRUCTION_HINT, foreground="#555", wraplength=440, font=("Segoe UI", 8)).grid(
            row=7, column=0, sticky="w", **pad
        )

        cap_row = ttk.Frame(frm)
        cap_row.grid(row=8, column=0, sticky="ew", **pad)
        ttk.Button(cap_row, text="Capture", command=self._capture).pack(side=tk.LEFT, padx=2)
        ttk.Button(cap_row, text="Apply filter", command=self._apply_filter).pack(side=tk.LEFT, padx=2)

        ttk.Label(frm, text="Raw OCR").grid(row=9, column=0, sticky="w", **pad)
        self.raw_box = scrolledtext.ScrolledText(frm, height=6, font=("Consolas", 9))
        self.raw_box.grid(row=10, column=0, sticky="nsew", **pad)

        ttk.Label(frm, text="Structured result").grid(row=11, column=0, sticky="w", **pad)
        self.out_box = scrolledtext.ScrolledText(frm, height=8, font=("Consolas", 10))
        self.out_box.grid(row=12, column=0, sticky="nsew", **pad)

        self.status = tk.StringVar(value="Ready.")
        ttk.Label(frm, textvariable=self.status, foreground="#333").grid(row=13, column=0, sticky="w", **pad)

        act = ttk.Frame(frm)
        act.grid(row=14, column=0, sticky="ew", **pad)
        ttk.Button(act, text="Copy", command=self._copy).pack(side=tk.LEFT, padx=4)
        ttk.Button(act, text="Type", command=self._type).pack(side=tk.LEFT, padx=4)

        ttk.Label(
            frm,
            text="Type: click the destination field first, then press Type (uses Ctrl+V).",
            font=("Segoe UI", 8),
            foreground="#555",
        ).grid(row=15, column=0, sticky="w", **pad)

        frm.columnconfigure(0, weight=1)
        frm.rowconfigure(10, weight=1)
        frm.rowconfigure(12, weight=2)

    def _check_tesseract(self) -> None:
        if is_tesseract_available():
            try:
                path = require_tesseract()
                self.status.set(f"Ready. Tesseract: {path}")
            except FileNotFoundError:
                pass
            return
        self.status.set("Tesseract not found — install OCR before Capture.")
        messagebox.showwarning("Tesseract required", INSTALL_HELP)

    def _show_overlay(self) -> None:
        if hasattr(self, "overlay"):
            self.overlay.show()

    def _hide_overlay(self) -> None:
        if hasattr(self, "overlay"):
            self.overlay.hide()

    def _poll_overlay(self) -> None:
        try:
            self.overlay.run_async()
        except tk.TclError:
            pass
        self.root.after(30, self._poll_overlay)

    def _on_region_change(self, rect: ScreenRect) -> None:
        self.last_rect = rect
        if hasattr(self, "region_var"):
            self.region_var.set(f"Region: {rect.left},{rect.top}  {rect.width}×{rect.height}")

    def _capture(self) -> None:
        if sys.platform != "win32":
            messagebox.showwarning("Platform", "This tool is intended for Windows. Capture may still work on Linux/macOS.")
        self.overlay.show()
        self.root.update()
        rect = self.overlay.get_rect()
        self.last_rect = rect
        try:
            img = grab_region(rect)
            self.raw_ocr = run_ocr(img)
        except FileNotFoundError as exc:
            messagebox.showerror("Tesseract required", str(exc))
            self.status.set("Install Tesseract OCR (see dialog).")
            return
        except Exception as exc:  # noqa: BLE001
            messagebox.showerror("Capture failed", str(exc))
            self.status.set(f"Error: {exc}")
            return

        self.raw_box.delete("1.0", tk.END)
        self.raw_box.insert(tk.END, self.raw_ocr)
        self._apply_filter()
        self.status.set("Captured. OCR complete.")

    def _apply_filter(self) -> None:
        self.raw_ocr = self.raw_box.get("1.0", tk.END).strip()
        instr = self.instruction.get().strip()
        res = extract(self.raw_ocr, instr)
        self.result_text = res.text
        self.out_box.delete("1.0", tk.END)
        self.out_box.insert(tk.END, res.text)
        note = f" ({res.note})" if res.note else ""
        self.status.set(f"Mode: {res.mode}{note}")

    def _copy(self) -> None:
        text = self.out_box.get("1.0", tk.END).strip()
        if not text:
            messagebox.showinfo("Copy", "Nothing to copy.")
            return
        copy_to_clipboard(text)
        self.status.set("Copied to clipboard.")

    def _type(self) -> None:
        text = self.out_box.get("1.0", tk.END).strip()
        if not text:
            messagebox.showinfo("Type", "Nothing to type.")
            return
        self.root.after(300, lambda: self._do_type(text))

    def _do_type(self, text: str) -> None:
        try:
            type_into_focused_field(text, use_paste=True)
            self.status.set("Pasted into focused field (Ctrl+V).")
        except Exception as exc:  # noqa: BLE001
            messagebox.showerror("Type failed", str(exc))

    def run(self) -> None:
        self.overlay.show()
        self.root.mainloop()


def main() -> None:
    if sys.platform == "win32":
        try:
            import ctypes

            ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID("ScreenRegionOCR.1.0")
        except Exception:
            pass
    ControlPanel().run()


if __name__ == "__main__":
    main()
