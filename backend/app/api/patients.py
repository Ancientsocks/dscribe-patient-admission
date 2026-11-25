"""Patient REST endpoints."""

from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.patient import (
    AppliedFilters,
    PaginatedPatients,
    PatientCreate,
    PatientRead,
    PatientUpdate,
)
from app.services import patient_service

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.get(
    "",
    response_model=PaginatedPatients,
    summary="List patients",
    description=(
        "Returns a paginated list of patients. Supports case-insensitive partial name search, "
        "multi-value ward/department/doctor filters, a status filter and pagination."
    ),
)
def list_patients(
    search: Optional[str] = Query(None, max_length=100, description="Partial, case-insensitive name search."),
    ward: Optional[List[str]] = Query(None, description="Filter by ward (repeatable)."),
    department: Optional[List[str]] = Query(None, description="Filter by department (repeatable)."),
    doctor: Optional[List[str]] = Query(None, description="Filter by doctor (repeatable)."),
    status_filter: Optional[str] = Query(
        None, alias="status", pattern="^(Admitted|Discharged)$", description="Admitted or Discharged."
    ),
    page: int = Query(1, ge=1, description="Page number (1-based)."),
    page_size: int = Query(10, ge=1, le=100, description="Records per page (1-100)."),
    session: Session = Depends(get_db),
) -> PaginatedPatients:
    items, total, current_page, size, total_pages = patient_service.list_patients(
        session,
        search=search,
        wards=ward,
        departments=department,
        doctors=doctor,
        status=status_filter,
        page=page,
        page_size=page_size,
    )
    return PaginatedPatients(
        items=[PatientRead.model_validate(patient) for patient in items],
        total=total,
        page=current_page,
        page_size=size,
        total_pages=total_pages,
        has_next=current_page < total_pages,
        has_previous=current_page > 1,
        applied_filters=AppliedFilters(
            search=search,
            ward=list(ward or []),
            department=list(department or []),
            doctor=list(doctor or []),
            status=status_filter,
        ),
    )


@router.get("/{patient_id}", response_model=PatientRead, summary="Get a patient")
def get_patient(patient_id: int, session: Session = Depends(get_db)) -> PatientRead:
    patient = patient_service.get_patient(session, patient_id)
    return PatientRead.model_validate(patient)


@router.post(
    "",
    response_model=PatientRead,
    status_code=status.HTTP_201_CREATED,
    summary="Admit a new patient",
)
def create_patient(payload: PatientCreate, session: Session = Depends(get_db)) -> PatientRead:
    patient = patient_service.create_patient(session, payload)
    return PatientRead.model_validate(patient)


@router.put("/{patient_id}", response_model=PatientRead, summary="Update a patient")
def update_patient(
    patient_id: int, payload: PatientUpdate, session: Session = Depends(get_db)
) -> PatientRead:
    patient = patient_service.update_patient(session, patient_id, payload)
    return PatientRead.model_validate(patient)


@router.delete("/{patient_id}", summary="Delete a patient")
def delete_patient(patient_id: int, session: Session = Depends(get_db)) -> dict:
    patient = patient_service.delete_patient(session, patient_id)
    return {"message": f"{patient.name} was removed from the patient register.", "id": patient_id}


@router.patch(
    "/{patient_id}/discharge",
    response_model=PatientRead,
    summary="Discharge a patient",
)
def discharge_patient(patient_id: int, session: Session = Depends(get_db)) -> PatientRead:
    patient = patient_service.discharge_patient(session, patient_id)
    return PatientRead.model_validate(patient)
