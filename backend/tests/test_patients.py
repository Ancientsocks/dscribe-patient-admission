"""CRUD, discharge and persistence behaviour of the patient API."""

from __future__ import annotations

from datetime import date, timedelta

from tests.conftest import build_client, patient_payload

from app.core.config import get_settings
from app.database.session import reset_engine


def test_create_patient_returns_201_and_persists(client):
    response = client.post("/api/patients", json=patient_payload())
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["id"] > 0
    assert body["name"] == "Alice Johnson"
    assert body["status"] == "Admitted"
    assert body["created_at"] and body["updated_at"]

    fetched = client.get(f"/api/patients/{body['id']}")
    assert fetched.status_code == 200
    assert fetched.json()["name"] == "Alice Johnson"


def test_name_is_trimmed_and_whitespace_collapsed(client):
    response = client.post("/api/patients", json=patient_payload(name="   Alice    Johnson   "))
    assert response.status_code == 201, response.text
    assert response.json()["name"] == "Alice Johnson"


def test_list_patients_empty_state(client):
    response = client.get("/api/patients")
    assert response.status_code == 200
    body = response.json()
    assert body["items"] == []
    assert body["total"] == 0
    assert body["total_pages"] == 1


def test_get_missing_patient_returns_404(client):
    response = client.get("/api/patients/9999")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"


def test_update_patient(client, make_patient):
    patient = make_patient()
    response = client.put(
        f"/api/patients/{patient['id']}",
        json={"ward": "Private Ward", "doctor": "Dr. Meera Iyer", "age": 36},
    )
    assert response.status_code == 200, response.text
    updated = response.json()
    assert updated["ward"] == "Private Ward"
    assert updated["doctor"] == "Dr. Meera Iyer"
    assert updated["age"] == 36
    assert updated["name"] == patient["name"]  # untouched fields survive a partial update


def test_update_missing_patient_returns_404(client):
    response = client.put("/api/patients/424242", json={"ward": "ICU"})
    assert response.status_code == 404


def test_delete_patient(client, make_patient):
    patient = make_patient()
    response = client.delete(f"/api/patients/{patient['id']}")
    assert response.status_code == 200
    assert "removed" in response.json()["message"].lower()
    assert client.get(f"/api/patients/{patient['id']}").status_code == 404
    assert client.get("/api/patients").json()["total"] == 0


def test_delete_missing_patient_returns_404(client):
    assert client.delete("/api/patients/777").status_code == 404


def test_discharge_patient_keeps_admission_date(client, make_patient):
    patient = make_patient(admission_date=(date.today() - timedelta(days=6)).isoformat())
    response = client.patch(f"/api/patients/{patient['id']}/discharge")
    assert response.status_code == 200, response.text
    discharged = response.json()
    assert discharged["status"] == "Discharged"
    assert discharged["admission_date"] == patient["admission_date"]


def test_discharging_twice_returns_409(client, make_patient):
    patient = make_patient()
    assert client.patch(f"/api/patients/{patient['id']}/discharge").status_code == 200
    second = client.patch(f"/api/patients/{patient['id']}/discharge")
    assert second.status_code == 409
    assert second.json()["error"]["code"] == "CONFLICT"


def test_discharged_patient_cannot_be_readmitted_via_update(client, make_patient):
    patient = make_patient()
    client.patch(f"/api/patients/{patient['id']}/discharge")
    response = client.put(f"/api/patients/{patient['id']}", json={"status": "Admitted"})
    assert response.status_code == 409
    assert client.get(f"/api/patients/{patient['id']}").json()["status"] == "Discharged"


def test_duplicate_admission_is_rejected(client):
    payload = patient_payload()
    assert client.post("/api/patients", json=payload).status_code == 201
    duplicate = client.post("/api/patients", json=payload)
    assert duplicate.status_code == 409
    assert duplicate.json()["error"]["code"] == "CONFLICT"


def test_data_survives_application_restart(monkeypatch, tmp_path):
    database_path = tmp_path / "persistent.db"
    with build_client(monkeypatch, database_path) as first_client:
        created = first_client.post("/api/patients", json=patient_payload(name="Persistent Patel"))
        assert created.status_code == 201, created.text
        patient_id = created.json()["id"]

    # Simulate a server restart: drop the engine/session factory and rebuild the app.
    reset_engine()
    get_settings.cache_clear()

    with build_client(monkeypatch, database_path) as second_client:
        response = second_client.get(f"/api/patients/{patient_id}")
        assert response.status_code == 200, response.text
        assert response.json()["name"] == "Persistent Patel"
        assert second_client.get("/api/patients").json()["total"] == 1

    reset_engine()
    get_settings.cache_clear()
