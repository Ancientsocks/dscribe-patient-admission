"""Seed command: ``python -m app.seed``.

Inserts demo patients only when an identical admission (same name, ward and
admission date) does not already exist. Existing records are never modified or
deleted, so the command is safe to run repeatedly.
"""

from __future__ import annotations

import argparse
from datetime import date, timedelta

from sqlalchemy import func, select

from app.database.session import get_session_factory, init_db
from app.models import Patient

DEMO_PATIENTS = [
    ("Ananya Sharma", 34, "Female", "ICU", "Cardiology", "Dr. Aisha Verma", 12, "Admitted"),
    ("Rahul Deshmukh", 56, "Male", "General Ward", "General Medicine", "Dr. Rohan Mehta", 9, "Admitted"),
    ("Fatima Khan", 28, "Female", "Maternity Ward", "Pediatrics", "Dr. Priya Nair", 7, "Admitted"),
    ("Vikram Singh", 61, "Male", "Private Ward", "Orthopedics", "Dr. Arjun Malhotra", 6, "Admitted"),
    ("Meera Krishnan", 45, "Female", "General Ward", "Oncology", "Dr. Meera Iyer", 5, "Admitted"),
    ("Aditya Bose", 8, "Male", "Pediatric Ward", "Pediatrics", "Dr. Kavya Reddy", 4, "Admitted"),
    ("Sneha Patil", 39, "Female", "Emergency", "Surgery", "Dr. Daniel Fernandes", 3, "Admitted"),
    ("Imran Sheikh", 72, "Male", "ICU", "Neurology", "Dr. Sanjay Kulkarni", 2, "Admitted"),
    ("Grace Thomas", 31, "Female", "Private Ward", "Cardiology", "Dr. Aisha Verma", 20, "Discharged"),
    ("Nikhil Rao", 24, "Male", "General Ward", "Orthopedics", "Dr. Arjun Malhotra", 18, "Discharged"),
    ("Pooja Gupta", 50, "Female", "General Ward", "General Medicine", "Dr. Rohan Mehta", 15, "Discharged"),
    ("Karan Malhotra", 13, "Male", "Pediatric Ward", "Pediatrics", "Dr. Kavya Reddy", 11, "Admitted"),
]


def seed() -> int:
    init_db()
    session = get_session_factory()()
    inserted = 0
    today = date.today()
    try:
        for name, age, gender, ward, department, doctor, days_ago, status in DEMO_PATIENTS:
            admission_date = today - timedelta(days=days_ago)
            exists = session.execute(
                select(func.count(Patient.id)).where(
                    func.lower(Patient.name) == name.lower(),
                    Patient.ward == ward,
                    Patient.admission_date == admission_date,
                )
            ).scalar_one()
            if exists:
                continue
            session.add(
                Patient(
                    name=name,
                    age=age,
                    gender=gender,
                    ward=ward,
                    department=department,
                    doctor=doctor,
                    admission_date=admission_date,
                    status=status,
                )
            )
            inserted += 1
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

    total = session_total()
    print(f"Seed complete: {inserted} new patient(s) inserted, {total} patient(s) in the database.")
    return inserted


def session_total() -> int:
    session = get_session_factory()()
    try:
        return int(session.execute(select(func.count(Patient.id))).scalar_one())
    finally:
        session.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed demo patient admissions (idempotent).")
    parser.parse_args()
    seed()
