import pytest

from apps.billing.models import BillLine
from apps.lab.models import LabTest, TestDepartment
from apps.lab.services.result_completion import bill_results_completed


@pytest.mark.django_db
def test_bill_results_pending_until_all_values_saved(auth_client, branch, admin_user):
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
    bill_id = create_res.data["id"]
    line = BillLine.objects.get(bill_id=bill_id)
    from apps.billing.models import Bill

    bill = Bill.objects.get(pk=bill_id)
    assert bill_results_completed(bill) is False

    auth_client.post(
        f"/api/lab/result-bills/{bill_id}/save-results/",
        {
            "results": [
                {
                    "bill_line_id": line.id,
                    "lab_test_id": test.id,
                    "result_key": "main",
                    "value": "42",
                },
            ],
        },
        format="json",
    )
    bill.refresh_from_db()
    assert bill_results_completed(bill) is True

    pending = auth_client.get("/api/lab/result-bills/", {"patient": patient.id, "results_status": "pending"})
    completed = auth_client.get(
        "/api/lab/result-bills/",
        {"patient": patient.id, "results_status": "completed"},
    )
    assert pending.status_code == 200
    assert completed.status_code == 200
    assert not any(row["id"] == bill_id for row in pending.data["results"])
    assert any(row["id"] == bill_id for row in completed.data["results"])
