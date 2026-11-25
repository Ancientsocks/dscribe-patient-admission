"""Reusable field-level validation helpers (shared by create/update schemas)."""

from __future__ import annotations

import re
from datetime import date, datetime

from app.core.options import match_option

NAME_MAX_LENGTH = 100
AGE_MIN = 0
AGE_MAX = 120

_WHOLE_NUMBER = re.compile(r"^\d+$")


def normalise_name(value: object) -> str:
    """Trim, collapse internal whitespace and enforce letters-only names."""
    if value is None:
        raise ValueError("Name is required.")
    if not isinstance(value, str):
        raise ValueError("Name must be text.")

    cleaned = " ".join(value.split())
    if not cleaned:
        raise ValueError("Name is required.")
    if len(cleaned) > NAME_MAX_LENGTH:
        raise ValueError(f"Name cannot be longer than {NAME_MAX_LENGTH} characters.")

    for part in cleaned.split(" "):
        if not part.isalpha():
            raise ValueError("Name may contain only letters and spaces (no numbers or special characters).")
    return cleaned


def normalise_age(value: object) -> int:
    """Accept whole numbers only; reject decimals, negatives, booleans and junk."""
    if value is None:
        raise ValueError("Age is required.")
    if isinstance(value, bool):
        raise ValueError("Age must be a whole number between 0 and 120.")

    if isinstance(value, float):
        if not value.is_integer():
            raise ValueError("Age must be a whole number, decimals are not allowed.")
        value = int(value)
    elif isinstance(value, str):
        candidate = value.strip()
        if not _WHOLE_NUMBER.match(candidate):
            raise ValueError("Age must be a whole number between 0 and 120.")
        value = int(candidate)
    elif not isinstance(value, int):
        raise ValueError("Age must be a whole number between 0 and 120.")

    if value < AGE_MIN or value > AGE_MAX:
        raise ValueError(f"Age must be between {AGE_MIN} and {AGE_MAX}.")
    return value


def normalise_option(value: object, options: tuple[str, ...] | list[str], label: str) -> str:
    """Case-insensitive match against a central option list."""
    if value is None or (isinstance(value, str) and not value.strip()):
        raise ValueError(f"{label} is required.")
    if not isinstance(value, str):
        raise ValueError(f"{label} must be one of: {', '.join(options)}.")
    matched = match_option(value, options)
    if matched is None:
        raise ValueError(f"{label} must be one of: {', '.join(options)}.")
    return matched


def normalise_admission_date(value: object) -> date:
    """Admission date is required, must be a real date and never in the future."""
    if value is None or (isinstance(value, str) and not value.strip()):
        raise ValueError("Admission date is required.")
    if isinstance(value, datetime):
        parsed = value.date()
    elif isinstance(value, date):
        parsed = value
    elif isinstance(value, str):
        try:
            parsed = date.fromisoformat(value.strip())
        except ValueError:
            raise ValueError("Admission date must be a valid date (YYYY-MM-DD).") from None
    else:
        raise ValueError("Admission date must be a valid date (YYYY-MM-DD).")

    if parsed > date.today():
        raise ValueError("Admission date cannot be in the future.")
    return parsed
