import pytest

from apps.billing.models import BillLine
from apps.lab.models import LabBillLineResult, LabTest, TestDepartment


@pytest.mark.django_db
def test_save_lab_results_persists_values(auth_client, branch, admin_user):
    dept = TestDepartment.objects.create(
        name="Bio",
        code="BIO",
        branch=branch,
        created_by=admin_user,
        updated_by=admin_user,
    )
    test = LabTest.objects.create(
        name="Vitamin D",
        code="VITD",
        branch=branch,
        department=dept,
        created_by=admin_user,
        updated_by=admin_user,
        default_rate="1200.00",
    )
    from apps.core.models import Patient

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
                    "quantity": "1",
                    "unit_price": "1200.00",
                },
            ],
        },
        format="json",
    )
    assert create_res.status_code == 201, create_res.data
    bill_id = create_res.data["id"]
    line = BillLine.objects.get(bill_id=bill_id)

    save_res = auth_client.post(
        f"/api/lab/result-bills/{bill_id}/save-results/",
        {
            "doctor_name": "Dr Smith",
            "results": [
                {
                    "bill_line_id": line.id,
                    "lab_test_id": test.id,
                    "result_key": "main",
                    "value": "42.5",
                },
            ],
        },
        format="json",
    )
    assert save_res.status_code == 200, save_res.data
    assert save_res.data["doctor_name"] == "Dr Smith"
    assert save_res.data["saved_results"] == [
        {
            "bill_line_id": line.id,
            "lab_test_id": test.id,
            "result_key": "main",
            "value": "42.5",
        },
    ]
    from apps.lab.services.result_values import storage_result_key

    assert LabBillLineResult.objects.filter(
        bill_line=line,
        result_key=storage_result_key(test.id, "main"),
        value="42.5",
    ).exists()

    detail_res = auth_client.get(f"/api/lab/result-bills/{bill_id}/")
    assert detail_res.status_code == 200
    assert detail_res.data["saved_results"][0]["value"] == "42.5"
