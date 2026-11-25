"""Backend validation tests - the API must reject bad data even if the UI is bypassed."""

from __future__ import annotations

from datetime import date, timedelta

import pytest

from tests.conftest import patient_payload


def _error_fields(response) -> set[str]:
    return {detail["field"] for detail in response.json()["error"]["details"]}


@pytest.mark.parametrize(
    "name",
    ["John123", "Jane!", "@dmin", "12345", "   ", "", "Alice 2nd", "O'Brien"],
)
def test_invalid_names_are_rejected(client, name):
    response = client.post("/api/patients", json=patient_payload(name=name))
    assert response.status_code == 422, response.text
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"
    assert "name" in _error_fields(response)


def test_valid_names_with_spaces_are_accepted(client):
    response = client.post("/api/patients", json=patient_payload(name="Mary Jane Watson"))
    assert response.status_code == 201, response.text


def test_missing_required_fields_are_rejected(client):
    response = client.post("/api/patients", json={"name": "Only A Name"})
    assert response.status_code == 422
    fields = _error_fields(response)
    assert {"age", "gender", "ward", "department", "doctor", "admission_date"} <= fields


@pytest.mark.parametrize("age", [-1, -30, 121, 400])
def test_age_out_of_range_is_rejected(client, age):
    response = client.post("/api/patients", json=patient_payload(age=age))
    assert response.status_code == 422
    assert "age" in _error_fields(response)


@pytest.mark.parametrize("age", [18.5, "abc", "", None, True, "12.7"])
def test_non_integer_age_is_rejected(client, age):
    response = client.post("/api/patients", json=patient_payload(age=age))
    assert response.status_code == 422
    assert "age" in _error_fields(response)


@pytest.mark.parametrize("age", [0, 120])
def test_age_boundaries_are_accepted(client, age):
    response = client.post("/api/patients", json=patient_payload(age=age))
    assert response.status_code == 201, response.text


@pytest.mark.parametrize(
    "field,value",
    [
        ("gender", "Alien"),
        ("ward", "Rooftop"),
        ("department", "Astrology"),
        ("doctor", "Dr. Nobody"),
        ("status", "Recovered"),
    ],
)
def test_invalid_dropdown_values_are_rejected(client, field, value):
    response = client.post("/api/patients", json=patient_payload(**{field: value}))
    assert response.status_code == 422, response.text
    assert field in _error_fields(response)


@pytest.mark.parametrize("field", ["gender", "ward", "department", "doctor"])
def test_missing_dropdown_values_are_rejected(client, field):
    payload = patient_payload()
    payload.pop(field)
    response = client.post("/api/patients", json=payload)
    assert response.status_code == 422
    assert field in _error_fields(response)


def test_future_admission_date_is_rejected(client):
    tomorrow = (date.today() + timedelta(days=1)).isoformat()
    response = client.post("/api/patients", json=patient_payload(admission_date=tomorrow))
    assert response.status_code == 422
    assert "admission_date" in _error_fields(response)
    assert "future" in response.json()["error"]["message"].lower()


def test_today_is_a_valid_admission_date(client):
    response = client.post("/api/patients", json=patient_payload(admission_date=date.today().isoformat()))
    assert response.status_code == 201, response.text


@pytest.mark.parametrize("value", ["not-a-date", "2024-13-45", "", None])
def test_invalid_admission_date_is_rejected(client, value):
    response = client.post("/api/patients", json=patient_payload(admission_date=value))
    assert response.status_code == 422
    assert "admission_date" in _error_fields(response)


def test_update_with_invalid_values_is_rejected(client, make_patient):
    patient = make_patient()
    response = client.put(f"/api/patients/{patient['id']}", json={"age": 999})
    assert response.status_code == 422
    assert client.get(f"/api/patients/{patient['id']}").json()["age"] == patient["age"]


def test_update_with_future_date_is_rejected(client, make_patient):
    patient = make_patient()
    tomorrow = (date.today() + timedelta(days=3)).isoformat()
    response = client.put(f"/api/patients/{patient['id']}", json={"admission_date": tomorrow})
    assert response.status_code == 422
    assert "admission_date" in _error_fields(response)


def test_update_with_null_field_is_rejected(client, make_patient):
    patient = make_patient()
    response = client.put(f"/api/patients/{patient['id']}", json={"name": None})
    assert response.status_code == 422
    assert "name" in _error_fields(response)


def test_malformed_json_body_returns_422(client):
    response = client.post(
        "/api/patients",
        content=b'{"name": "Bad JSON"',
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_error_response_has_clear_message(client):
    response = client.post("/api/patients", json=patient_payload(name="John123"))
    body = response.json()
    assert body["error"]["message"]
    assert body["error"]["details"]
    assert body["detail"] == body["error"]["message"]
