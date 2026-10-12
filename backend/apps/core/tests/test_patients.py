import pytest


@pytest.mark.django_db
def test_patient_crud(auth_client, branch):
    payload = {
        "name": "Jane Doe",
        "gender": "F",
        "phone": "9876543210",
        "address": "123 Street",
        "branch": branch.id,
    }
    create = auth_client.post("/api/patients/", payload, format="json")
    assert create.status_code == 201
    assert create.data["uhid"].startswith("HMS-")
    patient_id = create.data["id"]

    detail = auth_client.get(f"/api/patients/{patient_id}/")
    assert detail.status_code == 200
    assert detail.data["name"] == "Jane Doe"

    update = auth_client.patch(
        f"/api/patients/{patient_id}/", {"phone": "1111111111"}, format="json"
    )
    assert update.status_code == 200
    assert update.data["phone"] == "1111111111"

    delete = auth_client.delete(f"/api/patients/{patient_id}/")
    assert delete.status_code == 204
    list_resp = auth_client.get("/api/patients/")
    ids = [p["id"] for p in list_resp.data["results"]]
    assert patient_id not in ids


@pytest.mark.django_db
def test_patient_search(auth_client, branch):
    for i, name in enumerate(["Alice Smith", "Bob Jones", "Alice Brown"]):
        auth_client.post(
            "/api/patients/",
            {
                "name": name,
                "gender": "F" if i % 2 == 0 else "M",
                "phone": f"900000000{i}",
                "branch": branch.id,
            },
            format="json",
        )

    by_name = auth_client.get("/api/patients/", {"search": "Alice"})
    assert by_name.status_code == 200
    assert by_name.data["count"] == 2

    first = auth_client.get("/api/patients/").data["results"][0]
    by_uhid = auth_client.get("/api/patients/", {"search": first["uhid"]})
    assert by_uhid.data["count"] >= 1

    by_phone = auth_client.get("/api/patients/", {"search": "9000000001"})
    assert by_phone.data["count"] == 1
