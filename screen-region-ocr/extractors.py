"""Rule-based structured extraction from raw OCR text."""

from __future__ import annotations

import re
from dataclasses import dataclass


EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
PHONE_RE = re.compile(r"(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}")
ROLE_SUFFIX_RE = re.compile(
    r"\s*[-–—:|]\s*(.+)$",
)


@dataclass
class ExtractResult:
    text: str
    mode: str
    note: str = ""


def extract(raw: str, instruction: str) -> ExtractResult:
    instruction = (instruction or "").strip()
    key = instruction.lower()

    if not key or key in ("all", "everything", "full text"):
        return ExtractResult(text=raw.strip(), mode="all")

    if "email" in key:
        emails = sorted(set(EMAIL_RE.findall(raw)))
        return ExtractResult(
            text="\n".join(emails),
            mode="emails",
            note=f"{len(emails)} email(s)",
        )

    if "phone" in key or "tel" in key:
        phones = sorted(set(PHONE_RE.findall(raw)))
        cleaned = [p.strip() for p in phones if len(re.sub(r"\D", "", p)) >= 8]
        return ExtractResult(text="\n".join(cleaned), mode="phones", note=f"{len(cleaned)} phone(s)")

    if "name" in key and "role" in key:
        return _extract_name_role_lines(raw)

    if "student" in key and "name" in key:
        return _extract_likely_names(raw, student_hint=True)

    if "name" in key:
        return _extract_likely_names(raw, student_hint=False)

    if key.startswith("regex:"):
        pattern = instruction[6:].strip()
        try:
            rx = re.compile(pattern, re.MULTILINE)
            matches = rx.findall(raw)
            if matches and isinstance(matches[0], tuple):
                flat = [" ".join(m).strip() for m in matches]
            else:
                flat = [str(m).strip() for m in matches]
            return ExtractResult(text="\n".join(flat), mode="regex", note=pattern)
        except re.error as exc:
            return ExtractResult(text=raw.strip(), mode="error", note=f"Invalid regex: {exc}")

    # Unknown instruction — return raw with hint
    return ExtractResult(
        text=raw.strip(),
        mode="passthrough",
        note='Unknown instruction; showing full OCR. Try "emails", "names", "names and roles", or regex:...',
    )


def _extract_likely_names(raw: str, *, student_hint: bool) -> ExtractResult:
    lines = [ln.strip() for ln in raw.split("\n") if ln.strip()]
    names: list[str] = []
    for ln in lines:
        if EMAIL_RE.search(ln) or PHONE_RE.search(ln):
            continue
        if re.search(r"\d{4,}", ln):
            continue
        # Skip header-like all-caps short tokens
        if ln.isupper() and len(ln.split()) <= 3:
            continue
        # Name-like: mostly letters, 2–5 words
        words = ln.replace(",", " ").split()
        if not 1 <= len(words) <= 5:
            continue
        alpha_ratio = sum(c.isalpha() for c in ln) / max(len(ln), 1)
        if alpha_ratio < 0.6:
            continue
        if student_hint and any(w.lower() in {"id", "grade", "class", "student", "no.", "#"} for w in words):
            # Try to strip leading ID numbers
            ln2 = re.sub(r"^\d+\s+", "", ln)
            ln2 = re.sub(r"^\S+\s+(?=[A-Za-z])", "", ln2)
            if ln2:
                names.append(ln2.strip())
            continue
        names.append(ln)
    deduped = list(dict.fromkeys(names))
    return ExtractResult(
        text="\n".join(deduped),
        mode="names",
        note=f"{len(deduped)} line(s)",
    )


def _extract_name_role_lines(raw: str) -> ExtractResult:
    lines = [ln.strip() for ln in raw.split("\n") if ln.strip()]
    rows: list[str] = []
    for ln in lines:
        if EMAIL_RE.search(ln):
            continue
        m = ROLE_SUFFIX_RE.search(ln)
        if m:
            name_part = ROLE_SUFFIX_RE.sub("", ln).strip()
            role_part = m.group(1).strip()
            if name_part:
                rows.append(f"{name_part} — {role_part}")
        elif 2 <= len(ln.split()) <= 6 and sum(c.isalpha() for c in ln) / max(len(ln), 1) > 0.5:
            rows.append(ln)
    deduped = list(dict.fromkeys(rows))
    return ExtractResult(
        text="\n".join(deduped),
        mode="names_roles",
        note=f"{len(deduped)} row(s)",
    )
