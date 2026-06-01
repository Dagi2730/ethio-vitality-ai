"""Lightweight language detection for Amharic / English."""
from __future__ import annotations

import re

_ETHIOPIC = re.compile(r"[\u1200-\u137F]")


def detect_language(text: str, hint: str | None = None) -> str:
    """
    Auto-detect: Ethiopic script → am, else en.
    Explicit hint (en/am) used only when text is ambiguous (ASCII-only).
    """
    if _ETHIOPIC.search(text):
        return "am"
    if hint in ("en", "am"):
        return hint
    return "en"
