"""Shared pytest fixtures.

Every test runs against a fresh temporary SQLite file so tests are isolated and
the development database is never touched.
"""

from __future__ import annotations

import sys
from datetime import date, timedelta
from pathlib import Path
from typing import Callable

import pytest
from fastapi.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import get_settings  # noqa: E402
from app.core.options import get_doctors  # noqa: E402
from app.database.session import init_db, reset_engine  # noqa: E402
from app.main import create_app  # noqa: E402


def build_client(monkeypatch: pytest.MonkeyPatch, database_path: Path) -> TestClient:
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{database_path}")
    monkeypatch.setenv("ENVIRONMENT", "test")
    get_settings.cache_clear()
    reset_engine()
    init_db()
    return TestClient(create_app())


@pytest.fixture()
def client(monkeypatch: pytest.MonkeyPatch, tmp_path: Path):
    database_path = tmp_path / "test_dscribe.db"
    with build_client(monkeypatch, database_path) as test_client:
        yield test_client
    reset_engine()
    get_settings.cache_clear()


def past_date(days: int = 5) -> str:
    return (date.today() - timedelta(days=days)).isoformat()


def patient_payload(**overrides) -> dict:
    payload = {
        "name": "Alice Johnson",
        "age": 34,
        "gender": "Female",
        "ward": "ICU",
        "department": "Cardiology",
        "doctor": get_doctors()[0],
        "admission_date": past_date(4),
        "status": "Admitted",
    }
    payload.update(overrides)
    return payload


@pytest.fixture()
def make_patient(client: TestClient) -> Callable[..., dict]:
    def _make(**overrides) -> dict:
        response = client.post("/api/patients", json=patient_payload(**overrides))
        assert response.status_code == 201, response.text
        return response.json()

    return _make
