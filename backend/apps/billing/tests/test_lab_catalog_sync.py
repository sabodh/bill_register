import pytest

from apps.billing.models import BillingItem
from apps.billing.services.lab_catalog import billing_code_for_test, sync_lab_test_billing_item
from apps.lab.models import LabTest, TestDepartment


@pytest.mark.django_db
def test_lab_test_syncs_billing_item(branch, admin_user):
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
    sync_lab_test_billing_item(test)
    item = BillingItem.objects.get(branch=branch, code=billing_code_for_test(test.id))
    assert item.name == "Vitamin D"
    assert str(item.default_rate) == "1200.00"

    from rest_framework.test import APIClient

    client = APIClient()
    client.force_authenticate(user=admin_user)
    list_res = client.get("/api/billing/items/", {"catalog": "lab"})
    assert list_res.status_code == 200
    codes = [row["code"] for row in list_res.data["results"]]
    assert billing_code_for_test(test.id) in codes


@pytest.mark.django_db
def test_create_bill_accepts_lab_test_line(auth_client, branch, admin_user):
    from apps.core.models import Patient

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
    patient = Patient.objects.create(
        name="Test Patient",
        branch=branch,
        created_by=admin_user,
        updated_by=admin_user,
    )
    response = auth_client.post(
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
    assert response.status_code == 201, response.data
    assert response.data["bill_number"]
    assert response.data["status"] == "FINAL"
    assert BillingItem.objects.filter(code=billing_code_for_test(test.id)).exists()
    from apps.billing.models import BillLine

    line = BillLine.objects.get(bill_id=response.data["id"])
    assert line.lab_test_id == test.id

    bill_id = response.data["id"]
    update_res = auth_client.put(
        f"/api/billing/bills/{bill_id}/",
        {
            "patient": patient.id,
            "lines": [
                {
                    "lab_test": test.id,
                    "description": test.name,
                    "quantity": "2",
                    "unit_price": "1200.00",
                },
            ],
        },
        format="json",
    )
    assert update_res.status_code == 200, update_res.data
    line = BillLine.objects.get(bill_id=bill_id)
    assert str(line.quantity) == "2.00"
    assert str(update_res.data["total_amount"]) == "2400.00"

    advance_res = auth_client.put(
        f"/api/billing/bills/{bill_id}/",
        {
            "patient": patient.id,
            "advance_paid": "500.00",
            "lines": [
                {
                    "lab_test": test.id,
                    "description": test.name,
                    "quantity": "2",
                    "unit_price": "1200.00",
                },
            ],
        },
        format="json",
    )
    assert advance_res.status_code == 200, advance_res.data
    assert str(advance_res.data["advance_paid"]) == "500.00"
    assert str(advance_res.data["balance_due"]) == "1900.00"

    complete_res = auth_client.post(f"/api/lab/result-bills/{bill_id}/complete-payment/")
    assert complete_res.status_code == 200, complete_res.data
    assert str(complete_res.data["advance_paid"]) == "2400.00"
    assert str(complete_res.data["balance_due"]) == "0.00"

    already_paid = auth_client.post(f"/api/billing/bills/{bill_id}/complete-payment/")
    assert already_paid.status_code == 400

    cancel_res = auth_client.post(f"/api/billing/bills/{bill_id}/cancel/")
    assert cancel_res.status_code == 200, cancel_res.data
    from apps.billing.models import Bill, BillStatus

    assert Bill.objects.get(pk=bill_id).status == BillStatus.CANCELLED
    list_res = auth_client.get("/api/lab/result-bills/")
    assert list_res.status_code == 200
    assert not any(row["id"] == bill_id for row in list_res.data["results"])

    auth_client.post(
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
    patient_bills = auth_client.get("/api/lab/result-bills/", {"patient": patient.id})
    assert patient_bills.status_code == 200
    assert all(row["patient"] == patient.id for row in patient_bills.data["results"])
