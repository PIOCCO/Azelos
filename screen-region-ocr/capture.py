"""Screen capture for a bounding box in physical screen coordinates."""

from __future__ import annotations

from dataclasses import dataclass

import mss
from PIL import Image


@dataclass(frozen=True)
class ScreenRect:
    left: int
    top: int
    width: int
    height: int

    @property
    def right(self) -> int:
        return self.left + self.width

    @property
    def bottom(self) -> int:
        return self.top + self.height

    def clamp_min_size(self, min_w: int = 20, min_h: int = 20) -> ScreenRect:
        return ScreenRect(
            self.left,
            self.top,
            max(min_w, self.width),
            max(min_h, self.height),
        )

    def to_mss_dict(self) -> dict:
        return {"left": self.left, "top": self.top, "width": self.width, "height": self.height}


def grab_region(rect: ScreenRect) -> Image.Image:
    r = rect.clamp_min_size()
    with mss.mss() as sct:
        shot = sct.grab(r.to_mss_dict())
        return Image.frombytes("RGB", shot.size, shot.bgra, "raw", "BGRX")
