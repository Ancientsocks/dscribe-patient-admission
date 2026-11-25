"""Pydantic request/response schemas for patients."""

from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator

from app.core.options import (
    GENDERS,
    PATIENT_STATUSES,
    Department,
    Gender,
    PatientStatus,
    Ward,
    get_doctors,
)
from app.core.validation import (
    normalise_admission_date,
    normalise_age,
    normalise_name,
    normalise_option,
)


class PatientBase(BaseModel):
    """Shared validation for creating and updating a patient."""

    # Keep validated enums as plain strings so they map straight onto the DB columns.
    model_config = ConfigDict(use_enum_values=True)

    name: str = Field(..., description="Patient full name (letters and spaces only).")
    age: int = Field(..., ge=0, le=120, description="Patient age in years (0-120).")
    gender: Gender = Field(..., description="Male, Female or Other.")
    ward: Ward = Field(..., description="Ward the patient is admitted to.")
    department: Department = Field(..., description="Treating department.")
    doctor: str = Field(..., description="Assigned doctor from the configured roster.")
    admission_date: date = Field(..., description="Admission date (cannot be in the future).")
    status: PatientStatus = Field(default=PatientStatus.Admitted, description="Admitted or Discharged.")

    @field_validator("name", mode="before")
    @classmethod
    def _validate_name(cls, value: object) -> str:
        return normalise_name(value)

    @field_validator("age", mode="before")
    @classmethod
    def _validate_age(cls, value: object) -> int:
        return normalise_age(value)

    @field_validator("gender", mode="before")
    @classmethod
    def _validate_gender(cls, value: object) -> str:
        return normalise_option(value, GENDERS, "Gender")

    @field_validator("ward", mode="before")
    @classmethod
    def _validate_ward(cls, value: object) -> str:
        from app.core.options import WARDS

        return normalise_option(value, WARDS, "Ward")

    @field_validator("department", mode="before")
    @classmethod
    def _validate_department(cls, value: object) -> str:
        from app.core.options import DEPARTMENTS

        return normalise_option(value, DEPARTMENTS, "Department")

    @field_validator("doctor", mode="before")
    @classmethod
    def _validate_doctor(cls, value: object) -> str:
        return normalise_option(value, get_doctors(), "Doctor")

    @field_validator("admission_date", mode="before")
    @classmethod
    def _validate_admission_date(cls, value: object) -> date:
        return normalise_admission_date(value)

    @field_validator("status", mode="before")
    @classmethod
    def _validate_status(cls, value: object) -> str:
        return normalise_option(value, PATIENT_STATUSES, "Status")


class PatientCreate(PatientBase):
    """POST /api/patients payload."""


class PatientUpdate(PatientBase):
    """PUT /api/patients/{id} payload - every field optional, sent fields validated."""

    name: Optional[str] = Field(default=None, max_length=100)
    age: Optional[int] = Field(default=None, ge=0, le=120)
    gender: Optional[Gender] = None
    ward: Optional[Ward] = None
    department: Optional[Department] = None
    doctor: Optional[str] = None
    admission_date: Optional[date] = None
    status: Optional[PatientStatus] = None


class PatientRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    age: int
    gender: str
    ward: str
    department: str
    doctor: str
    admission_date: date
    status: str
    created_at: datetime
    updated_at: datetime

    @field_serializer("created_at", "updated_at")
    def _serialise_datetime(self, value: datetime) -> str:
        if value.tzinfo is None:
            value = value.replace(tzinfo=__import__("datetime").timezone.utc)
        return value.isoformat()


class AppliedFilters(BaseModel):
    search: Optional[str] = None
    ward: List[str] = Field(default_factory=list)
    department: List[str] = Field(default_factory=list)
    doctor: List[str] = Field(default_factory=list)
    status: Optional[str] = None


class PaginatedPatients(BaseModel):
    items: List[PatientRead]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_previous: bool
    applied_filters: AppliedFilters
