import pytest

from apps.lab.models import LabTest, TestDepartment


@pytest.mark.django_db
def test_lab_test_count_report(auth_client, branch, admin_user):
    from apps.core.models import Patient

    dept = TestDepartment.objects.create(
        name="Bio",
        code="BIO",
        branch=branch,
        created_by=admin_user,
        updated_by=admin_user,
    )
    from apps.lab.models import LabTestType

    test = LabTest.objects.create(
        name="CBC",
        code="CBC",
        branch=branch,
        department=dept,
        test_type=LabTestType.TYPE_2,
        created_by=admin_user,
        updated_by=admin_user,
        default_rate="500.00",
    )
    patient = Patient.objects.create(
        name="Test Patient",
        branch=branch,
        created_by=admin_user,
        updated_by=admin_user,
    )
    create_res = auth_client.post(
        "/api/billing/bills/",
        {
            "patient": patient.id,
            "lines": [
                {
                    "lab_test": test.id,
                    "description": test.name,
                    "quantity": "2",
                    "unit_price": "500.00",
                },
            ],
        },
        format="json",
    )
    assert create_res.status_code == 201, create_res.data

    res = auth_client.get("/api/reports/lab-tests/count/")
    assert res.status_code == 200, res.data
    assert res.data["summary"]["total_tests"] == "2"
    assert any(
        row["test_name"] == "CBC"
        and row["test_count"] == "2"
        and row["test_type_label"] == "Type-2"
        for row in res.data["rows"]
    )

    type_search = auth_client.get("/api/reports/lab-tests/count/", {"search": "type-2"})
    assert type_search.status_code == 200
    assert len(type_search.data["rows"]) == 1

    search_res = auth_client.get("/api/reports/lab-tests/count/", {"search": "cbc"})
    assert search_res.status_code == 200
    assert len(search_res.data["rows"]) == 1

    dept_search = auth_client.get("/api/reports/lab-tests/count/", {"search": "Bio"})
    assert dept_search.status_code == 200
    assert len(dept_search.data["rows"]) == 1

    miss_res = auth_client.get("/api/reports/lab-tests/count/", {"search": "no-such-test"})
    assert miss_res.status_code == 200
    assert miss_res.data["summary"]["total_tests"] == "0"
    assert miss_res.data["rows"] == []
