from app.services.dashboard_service import get_dashboard_stats
from app.services.patient_service import (
    create_patient,
    delete_patient,
    discharge_patient,
    get_patient,
    list_patients,
    update_patient,
)

__all__ = [
    "create_patient",
    "delete_patient",
    "discharge_patient",
    "get_dashboard_stats",
    "get_patient",
    "list_patients",
    "update_patient",
]
