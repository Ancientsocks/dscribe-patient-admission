"""Response schema for the central configuration endpoint."""

from __future__ import annotations

from typing import Dict, List

from pydantic import BaseModel


class OptionsResponse(BaseModel):
    genders: List[str]
    wards: List[str]
    departments: List[str]
    doctors: List[str]
    statuses: List[str]
    limits: Dict[str, int]
