"""Search, filtering and pagination tests."""

from __future__ import annotations

from tests.conftest import past_date


def test_search_is_case_insensitive_partial(client, make_patient):
    make_patient(name="Alice Johnson")
    make_patient(name="Bob Stone", ward="General Ward")
    make_patient(name="Alicia Keys", ward="Private Ward")

    response = client.get("/api/patients", params={"search": "ALI"})
    assert response.status_code == 200
    names = [item["name"] for item in response.json()["items"]]
    assert set(names) == {"Alice Johnson", "Alicia Keys"}

    lower = client.get("/api/patients", params={"search": "stone"}).json()
    assert [item["name"] for item in lower["items"]] == ["Bob Stone"]


def test_search_with_no_matches_returns_empty_page(client, make_patient):
    make_patient()
    body = client.get("/api/patients", params={"search": "zzz"}).json()
    assert body["items"] == []
    assert body["total"] == 0


def test_search_treats_wildcards_literally(client, make_patient):
    make_patient(name="Alice Johnson")
    body = client.get("/api/patients", params={"search": "%"}).json()
    assert body["total"] == 0


def test_filter_by_ward(client, make_patient):
    make_patient(ward="ICU")
    make_patient(name="Ward Two", ward="General Ward")

    body = client.get("/api/patients", params={"ward": "ICU"}).json()
    assert body["total"] == 1
    assert body["items"][0]["ward"] == "ICU"
    assert body["applied_filters"]["ward"] == ["ICU"]


def test_filter_by_department(client, make_patient):
    make_patient(department="Cardiology")
    make_patient(name="Neuro Patient", department="Neurology", ward="Private Ward")

    body = client.get("/api/patients", params={"department": "Neurology"}).json()
    assert body["total"] == 1
    assert body["items"][0]["department"] == "Neurology"


def test_filter_by_doctor(client, make_patient):
    make_patient(doctor="Dr. Aisha Verma")
    make_patient(name="Other Doctor", doctor="Dr. Rohan Mehta")

    body = client.get("/api/patients", params={"doctor": "Dr. Rohan Mehta"}).json()
    assert body["total"] == 1
    assert body["items"][0]["doctor"] == "Dr. Rohan Mehta"


def test_combined_filters_with_search(client, make_patient):
    make_patient(name="Alice Johnson", ward="ICU", department="Cardiology", doctor="Dr. Aisha Verma")
    make_patient(name="Alice Cooper", ward="General Ward", department="Cardiology", doctor="Dr. Aisha Verma")
    make_patient(name="Alice Brown", ward="ICU", department="Neurology", doctor="Dr. Priya Nair")

    body = client.get(
        "/api/patients",
        params=[
            ("search", "alice"),
            ("ward", "ICU"),
            ("department", "Cardiology"),
            ("doctor", "Dr. Aisha Verma"),
        ],
    ).json()
    assert body["total"] == 1
    assert body["items"][0]["name"] == "Alice Johnson"


def test_multiple_ward_values_are_ored(client, make_patient):
    make_patient(ward="ICU")
    make_patient(name="Second Patient", ward="Emergency")
    make_patient(name="Third Patient", ward="Private Ward")

    body = client.get("/api/patients", params=[("ward", "ICU"), ("ward", "Emergency")]).json()
    assert body["total"] == 2


def test_status_filter(client, make_patient):
    admitted = make_patient()
    discharged = make_patient(name="Discharged Dan", ward="General Ward")
    client.patch(f"/api/patients/{discharged['id']}/discharge")

    body = client.get("/api/patients", params={"status": "Discharged"}).json()
    assert body["total"] == 1
    assert body["items"][0]["id"] == discharged["id"]

    admitted_body = client.get("/api/patients", params={"status": "Admitted"}).json()
    assert admitted_body["total"] == 1
    assert admitted_body["items"][0]["id"] == admitted["id"]


def test_invalid_status_filter_returns_422(client):
    response = client.get("/api/patients", params={"status": "Recovered"})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_pagination_metadata_and_pages(client):
    for index in range(12):
        response = client.post(
            "/api/patients",
            json={
                "name": f"Patient Number{chr(97 + index)}",
                "age": 20 + index,
                "gender": "Male",
                "ward": "General Ward",
                "department": "General Medicine",
                "doctor": "Dr. Rohan Mehta",
                "admission_date": past_date(index + 1),
                "status": "Admitted",
            },
        )
        assert response.status_code == 201, response.text

    first_page = client.get("/api/patients", params={"page": 1, "page_size": 5}).json()
    assert first_page["total"] == 12
    assert first_page["total_pages"] == 3
    assert len(first_page["items"]) == 5
    assert first_page["has_next"] is True
    assert first_page["has_previous"] is False

    last_page = client.get("/api/patients", params={"page": 3, "page_size": 5}).json()
    assert len(last_page["items"]) == 2
    assert last_page["has_next"] is False
    assert last_page["has_previous"] is True

    out_of_range = client.get("/api/patients", params={"page": 99, "page_size": 5}).json()
    assert out_of_range["items"] == []
    assert out_of_range["total"] == 12


def test_page_size_is_capped(client, make_patient):
    make_patient()
    response = client.get("/api/patients", params={"page_size": 5000})
    assert response.status_code == 422


def test_invalid_page_number_returns_422(client):
    assert client.get("/api/patients", params={"page": 0}).status_code == 422
