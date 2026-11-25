"""Dashboard aggregation queries."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Patient
from app.schemas.dashboard import DashboardStats, DistributionItem


def _distribution(session: Session, column) -> list[DistributionItem]:
    statement = (
        select(column, func.count(Patient.id))
        .group_by(column)
        .order_by(func.count(Patient.id).desc(), column.asc())
    )
    return [DistributionItem(name=name, count=int(count)) for name, count in session.execute(statement)]


def get_dashboard_stats(session: Session, recent_limit: int = 5) -> DashboardStats:
    status_rows = session.execute(
        select(Patient.status, func.count(Patient.id)).group_by(Patient.status)
    ).all()
    counts = {status: int(count) for status, count in status_rows}
    admitted = counts.get("Admitted", 0)
    discharged = counts.get("Discharged", 0)

    recent = list(
        session.execute(
            select(Patient)
            .order_by(Patient.admission_date.desc(), Patient.created_at.desc(), Patient.id.desc())
            .limit(recent_limit)
        )
        .scalars()
        .all()
    )

    return DashboardStats(
        total_patients=admitted + discharged,
        admitted_patients=admitted,
        discharged_patients=discharged,
        ward_distribution=_distribution(session, Patient.ward),
        department_distribution=_distribution(session, Patient.department),
        recent_admissions=recent,
        generated_at=datetime.now(timezone.utc),
    )
