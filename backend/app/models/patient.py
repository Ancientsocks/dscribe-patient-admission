"""SQLAlchemy model for a patient admission."""

from __future__ import annotations

from datetime import date, datetime, timezone

from sqlalchemy import CheckConstraint, Date, DateTime, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.options import PATIENT_STATUSES
from app.database.base import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    gender: Mapped[str] = mapped_column(String(20), nullable=False)
    ward: Mapped[str] = mapped_column(String(40), nullable=False)
    department: Mapped[str] = mapped_column(String(40), nullable=False)
    doctor: Mapped[str] = mapped_column(String(80), nullable=False)
    admission_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Admitted")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow
    )

    __table_args__ = (
        CheckConstraint("age >= 0 AND age <= 120", name="ck_patients_age_range"),
        CheckConstraint(
            "status IN ('" + "','".join(PATIENT_STATUSES) + "')",
            name="ck_patients_status_valid",
        ),
        CheckConstraint("length(trim(name)) > 0", name="ck_patients_name_not_blank"),
        Index("ix_patients_name", "name"),
        Index("ix_patients_ward", "ward"),
        Index("ix_patients_department", "department"),
        Index("ix_patients_doctor", "doctor"),
        Index("ix_patients_status", "status"),
        Index("ix_patients_admission_date", "admission_date"),
    )

    def __repr__(self) -> str:  # pragma: no cover - debugging helper
        return f"<Patient id={self.id} name={self.name!r} status={self.status!r}>"
