"""Business logic for patients: querying, filtering, persistence and rules."""

from __future__ import annotations

from datetime import date
from typing import List, Optional, Sequence, Tuple

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.errors import ConflictError, NotFoundError
from app.models import Patient
from app.schemas.patient import PatientCreate, PatientUpdate


def _escape_like(term: str) -> str:
    return term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _apply_filters(
    statement: Select,
    *,
    search: Optional[str],
    wards: Sequence[str],
    departments: Sequence[str],
    doctors: Sequence[str],
    status: Optional[str],
) -> Select:
    if search and search.strip():
        pattern = f"%{_escape_like(search.strip())}%"
        statement = statement.where(Patient.name.ilike(pattern, escape="\\"))
    if wards:
        statement = statement.where(func.lower(Patient.ward).in_([value.lower() for value in wards]))
    if departments:
        statement = statement.where(
            func.lower(Patient.department).in_([value.lower() for value in departments])
        )
    if doctors:
        statement = statement.where(func.lower(Patient.doctor).in_([value.lower() for value in doctors]))
    if status:
        statement = statement.where(func.lower(Patient.status) == status.lower())
    return statement


def list_patients(
    session: Session,
    *,
    search: Optional[str] = None,
    wards: Optional[Sequence[str]] = None,
    departments: Optional[Sequence[str]] = None,
    doctors: Optional[Sequence[str]] = None,
    status: Optional[str] = None,
    page: int = 1,
    page_size: int = 10,
) -> Tuple[List[Patient], int, int, int, int]:
    """Return (items, total, page, page_size, total_pages) for the given filters."""
    max_page_size = get_settings().max_page_size
    page = max(1, page)
    page_size = min(max(1, page_size), max_page_size)

    base = _apply_filters(
        select(Patient),
        search=search,
        wards=wards or [],
        departments=departments or [],
        doctors=doctors or [],
        status=status,
    )

    count_statement = select(func.count()).select_from(base.subquery())
    total = int(session.execute(count_statement).scalar_one() or 0)
    total_pages = max(1, (total + page_size - 1) // page_size)

    statement = (
        base.order_by(Patient.admission_date.desc(), Patient.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    items = list(session.execute(statement).scalars().all())
    return items, total, page, page_size, total_pages


def get_patient(session: Session, patient_id: int) -> Patient:
    patient = session.get(Patient, patient_id)
    if patient is None:
        raise NotFoundError(f"Patient with id {patient_id} was not found.")
    return patient


def _find_duplicate(
    session: Session,
    *,
    name: str,
    age: int,
    ward: str,
    admission_date: date,
    exclude_id: Optional[int] = None,
) -> Optional[Patient]:
    statement = select(Patient).where(
        func.lower(Patient.name) == name.lower(),
        Patient.age == age,
        func.lower(Patient.ward) == ward.lower(),
        Patient.admission_date == admission_date,
        func.lower(Patient.status) == "admitted",
    )
    if exclude_id is not None:
        statement = statement.where(Patient.id != exclude_id)
    return session.execute(statement.limit(1)).scalars().first()


def create_patient(session: Session, payload: PatientCreate) -> Patient:
    duplicate = _find_duplicate(
        session,
        name=payload.name,
        age=payload.age,
        ward=str(payload.ward),
        admission_date=payload.admission_date,
    )
    if duplicate is not None:
        raise ConflictError(
            "This patient already has an active admission with the same ward and admission date.",
            details=[{"field": "name", "message": "A matching admitted patient already exists."}],
        )

    patient = Patient(
        name=payload.name,
        age=payload.age,
        gender=str(payload.gender),
        ward=str(payload.ward),
        department=str(payload.department),
        doctor=payload.doctor,
        admission_date=payload.admission_date,
        status=str(payload.status),
    )
    try:
        session.add(patient)
        session.commit()
    except Exception:
        session.rollback()
        raise
    session.refresh(patient)
    return patient


def update_patient(session: Session, patient_id: int, payload: PatientUpdate) -> Patient:
    patient = get_patient(session, patient_id)
    changes = payload.model_dump(exclude_unset=True, exclude_none=True)

    requested_status = changes.get("status")
    if requested_status is not None:
        requested_status = str(requested_status)
        if requested_status == "Admitted" and patient.status == "Discharged":
            raise ConflictError(
                "A discharged patient cannot be re-admitted. Create a new admission instead.",
                details=[{"field": "status", "message": "Invalid status transition."}],
            )

    for field, value in changes.items():
        if field == "status":
            value = str(value)
        elif field in {"gender", "ward", "department"}:
            value = str(value)
        setattr(patient, field, value)

    duplicate = _find_duplicate(
        session,
        name=patient.name,
        age=patient.age,
        ward=patient.ward,
        admission_date=patient.admission_date,
        exclude_id=patient.id,
    )
    if duplicate is not None and patient.status == "Admitted":
        session.rollback()
        raise ConflictError(
            "Another admitted patient already matches this name, age, ward and admission date.",
            details=[{"field": "name", "message": "Duplicate admission detected."}],
        )

    try:
        session.commit()
    except Exception:
        session.rollback()
        raise
    session.refresh(patient)
    return patient


def delete_patient(session: Session, patient_id: int) -> Patient:
    patient = get_patient(session, patient_id)
    try:
        session.delete(patient)
        session.commit()
    except Exception:
        session.rollback()
        raise
    return patient


def discharge_patient(session: Session, patient_id: int) -> Patient:
    patient = get_patient(session, patient_id)
    if patient.status == "Discharged":
        raise ConflictError(
            f"{patient.name} is already discharged.",
            details=[{"field": "status", "message": "Patient is already discharged."}],
        )

    patient.status = "Discharged"
    try:
        session.commit()
    except Exception:
        session.rollback()
        raise
    session.refresh(patient)
    return patient
