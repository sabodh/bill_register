import pytest

from apps.lab.models import LabTest, TestDepartment


@pytest.mark.django_db
def test_create_lab_package(auth_client, branch, admin_user):
    dept = TestDepartment.objects.create(
        name="Biochemistry",
        code="BIO",
        branch=branch,
        created_by=admin_user,
        updated_by=admin_user,
    )
    test = LabTest.objects.create(
        name="CBC",
        code="CBC",
        branch=branch,
        department=dept,
        created_by=admin_user,
        updated_by=admin_user,
        default_rate="100.00",
    )
    response = auth_client.post(
        "/api/lab/packages/",
        {
            "name": "Executive panel",
            "package_amount": "499.00",
            "items": [{"test": test.id}],
        },
        format="json",
    )
    assert response.status_code == 201, response.data
    assert response.data["name"] == "Executive panel"
    assert response.data["id"]
    assert len(response.data["items"]) == 1
    assert response.data["items"][0]["test_detail"]["name"] == "CBC"

    package_id = response.data["id"]
    patch_res = auth_client.patch(
        f"/api/lab/packages/{package_id}/",
        {"name": "Executive panel v2", "package_amount": "599.00", "items": [{"test": test.id}]},
        format="json",
    )
    assert patch_res.status_code == 200, patch_res.data
    assert patch_res.data["name"] == "Executive panel v2"

    list_res = auth_client.get("/api/lab/packages/")
    assert list_res.status_code == 200
    assert list_res.data["count"] == 1
