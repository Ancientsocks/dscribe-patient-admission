"""Dashboard, options and health endpoint tests."""

from __future__ import annotations


def test_dashboard_counts_and_distributions(client, make_patient):
    first = make_patient(name="Alice Johnson", ward="ICU", department="Cardiology")
    make_patient(name="Bob Stone", ward="General Ward", department="General Medicine")
    make_patient(name="Cara Diaz", ward="ICU", department="Neurology")
    client.patch(f"/api/patients/{first['id']}/discharge")

    response = client.get("/api/dashboard/stats")
    assert response.status_code == 200, response.text
    body = response.json()

    assert body["total_patients"] == 3
    assert body["admitted_patients"] == 2
    assert body["discharged_patients"] == 1

    wards = {item["name"]: item["count"] for item in body["ward_distribution"]}
    assert wards == {"ICU": 2, "General Ward": 1}

    departments = {item["name"]: item["count"] for item in body["department_distribution"]}
    assert departments == {"Cardiology": 1, "General Medicine": 1, "Neurology": 1}

    assert len(body["recent_admissions"]) == 3
    assert body["generated_at"]


def test_dashboard_is_empty_safe(client):
    body = client.get("/api/dashboard/stats").json()
    assert body["total_patients"] == 0
    assert body["ward_distribution"] == []
    assert body["recent_admissions"] == []


def test_dashboard_recent_admissions_are_limited_and_sorted(client, make_patient):
    names = ["Alpha Patient", "Bravo Patient", "Charlie Patient", "Delta Patient", "Echo Patient", "Foxtrot Patient", "Golf Patient"]
    for index, name in enumerate(names):
        make_patient(name=name, ward="General Ward", admission_date=f"2026-01-{index + 1:02d}")

    body = client.get("/api/dashboard/stats").json()
    dates = [item["admission_date"] for item in body["recent_admissions"]]
    assert len(dates) == 5
    assert dates == sorted(dates, reverse=True)


def test_options_endpoint_exposes_central_lists(client):
    response = client.get("/api/options")
    assert response.status_code == 200
    body = response.json()
    assert body["genders"] == ["Male", "Female", "Other"]
    assert "ICU" in body["wards"]
    assert "Cardiology" in body["departments"]
    assert len(body["doctors"]) >= 1
    assert body["statuses"] == ["Admitted", "Discharged"]
    assert body["limits"]["age_max"] == 120


def test_doctors_are_configurable_through_environment(client, monkeypatch):
    from app.core.config import get_settings

    monkeypatch.setenv("DOCTORS", "Dr. Custom One,Dr. Custom Two")
    get_settings.cache_clear()
    try:
        body = client.get("/api/options").json()
        assert body["doctors"] == ["Dr. Custom One", "Dr. Custom Two"]
    finally:
        get_settings.cache_clear()


def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["database"] == "ok"


def test_openapi_documentation_available(client):
    response = client.get("/openapi.json")
    assert response.status_code == 200
    paths = response.json()["paths"]
    assert "/api/patients" in paths
    assert "/api/patients/{patient_id}/discharge" in paths
    assert "/api/dashboard/stats" in paths
    assert "/api/options" in paths
    assert client.get("/docs").status_code == 200
