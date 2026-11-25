"""Dashboard and configuration endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.options import (
    DEPARTMENTS,
    GENDERS,
    PATIENT_STATUSES,
    WARDS,
    get_doctors,
)
from app.database.session import get_db
from app.schemas.dashboard import DashboardStats
from app.schemas.options import OptionsResponse
from app.services.dashboard_service import get_dashboard_stats

dashboard_router = APIRouter(prefix="/dashboard", tags=["Dashboard"])
options_router = APIRouter(tags=["Configuration"])


@dashboard_router.get(
    "/stats",
    response_model=DashboardStats,
    summary="Dashboard statistics",
    description="Totals, ward and department distributions and the most recent admissions.",
)
def dashboard_stats(session: Session = Depends(get_db)) -> DashboardStats:
    return get_dashboard_stats(session)


@options_router.get(
    "/options",
    response_model=OptionsResponse,
    summary="Selectable patient options",
    description="Central list of genders, wards, departments, doctors and statuses used by the UI.",
)
def get_options() -> OptionsResponse:
    settings = get_settings()
    return OptionsResponse(
        genders=list(GENDERS),
        wards=list(WARDS),
        departments=list(DEPARTMENTS),
        doctors=get_doctors(),
        statuses=list(PATIENT_STATUSES),
        limits={
            "age_min": 0,
            "age_max": 120,
            "name_max_length": 100,
            "max_page_size": settings.max_page_size,
        },
    )
