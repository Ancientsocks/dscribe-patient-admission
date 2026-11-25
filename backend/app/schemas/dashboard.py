"""Response schemas for the dashboard statistics endpoint."""

from __future__ import annotations

from datetime import datetime
from typing import List

from pydantic import BaseModel

from app.schemas.patient import PatientRead


class DistributionItem(BaseModel):
    name: str
    count: int


class DashboardStats(BaseModel):
    total_patients: int
    admitted_patients: int
    discharged_patients: int
    ward_distribution: List[DistributionItem]
    department_distribution: List[DistributionItem]
    recent_admissions: List[PatientRead]
    generated_at: datetime
