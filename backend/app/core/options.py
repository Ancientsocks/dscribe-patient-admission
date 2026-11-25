"""Single source of truth for every selectable patient option.

Both the API validation layer and the ``GET /api/options`` endpoint read from
these definitions, so adding a ward, department or doctor only has to happen
here (or in the ``DOCTORS`` environment variable).
"""

from enum import Enum
from typing import List, Optional, Type

from app.core.config import get_settings


def _str_enum(name: str, values: tuple[str, ...]) -> Type[Enum]:
    """Build a ``str`` enum whose member values are the option labels."""
    return Enum(name, {value.replace(" ", "_").replace("-", "_"): value for value in values}, type=str)


GENDERS: tuple[str, ...] = ("Male", "Female", "Other")
WARDS: tuple[str, ...] = (
    "General Ward",
    "ICU",
    "Emergency",
    "Private Ward",
    "Pediatric Ward",
    "Maternity Ward",
)
DEPARTMENTS: tuple[str, ...] = (
    "Cardiology",
    "Neurology",
    "Orthopedics",
    "Pediatrics",
    "General Medicine",
    "Oncology",
    "Surgery",
)
PATIENT_STATUSES: tuple[str, ...] = ("Admitted", "Discharged")

# The doctor list is configurable through the DOCTORS environment variable
# (comma separated) and falls back to a sensible hospital roster.
DEFAULT_DOCTORS: tuple[str, ...] = (
    "Dr. Aisha Verma",
    "Dr. Rohan Mehta",
    "Dr. Priya Nair",
    "Dr. Daniel Fernandes",
    "Dr. Sanjay Kulkarni",
    "Dr. Kavya Reddy",
    "Dr. Arjun Malhotra",
    "Dr. Meera Iyer",
)

Gender = _str_enum("Gender", GENDERS)
Ward = _str_enum("Ward", WARDS)
Department = _str_enum("Department", DEPARTMENTS)
PatientStatus = _str_enum("PatientStatus", PATIENT_STATUSES)


def get_doctors() -> List[str]:
    """Return the configured, de-duplicated doctor list."""
    configured = get_settings().doctor_list
    if not configured:
        return list(DEFAULT_DOCTORS)
    seen: dict[str, None] = {}
    for doctor in configured:
        cleaned = " ".join(doctor.split())
        if cleaned:
            seen.setdefault(cleaned, None)
    return list(seen) or list(DEFAULT_DOCTORS)


def match_option(value: str, options: tuple[str, ...] | List[str]) -> Optional[str]:
    """Case-insensitively match ``value`` against a list of options."""
    if not isinstance(value, str):
        return None
    needle = " ".join(value.split()).casefold()
    for option in options:
        if option.casefold() == needle:
            return option
    return None
