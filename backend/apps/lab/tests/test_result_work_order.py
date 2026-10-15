import pytest

from apps.billing.models import BillLine
from apps.lab.models import LabTest, TestDepartment
from apps.lab.services.result_worklist import build_lab_result_work_items


@pytest.mark.django_db
def test_save_results_persists_work_item_order(auth_client, branch, admin_user):
    from apps.core.models import Patient

    dept = TestDepartment.objects.create(
        name="Bio",
        code="BIO",
        branch=branch,
        created_by=admin_user,
        updated_by=admin_user,
    )
    tests = []
    for code, name in (("T1", "Alpha"), ("T2", "Beta"), ("T3", "Gamma")):
        tests.append(
            LabTest.objects.create(
                name=name,
                code=code,
                branch=branch,
                department=dept,
                created_by=admin_user,
                updated_by=admin_user,
                default_rate="100.00",
            )
        )
    patient = Patient.objects.create(
        name="Order Patient",
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
                    "lab_test": tests[i].id,
                    "description": tests[i].name,
                    "quantity": "1",
                    "unit_price": "100.00",
                }
                for i in range(3)
            ],
        },
        format="json",
    )
    assert create_res.status_code == 201, create_res.data
    bill_id = create_res.data["id"]
    lines = list(BillLine.objects.filter(bill_id=bill_id).order_by("sort_order", "id"))
    assert len(lines) == 3

    detail_res = auth_client.get(f"/api/lab/result-bills/{bill_id}/")
    assert detail_res.status_code == 200
    default_names = [row["test_name"] for row in detail_res.data["work_items"]]
    assert default_names == ["Alpha", "Beta", "Gamma"]

    reversed_order = [
        {"bill_line_id": lines[2].id, "lab_test_id": tests[2].id},
        {"bill_line_id": lines[0].id, "lab_test_id": tests[0].id},
        {"bill_line_id": lines[1].id, "lab_test_id": tests[1].id},
    ]
    save_res = auth_client.post(
        f"/api/lab/result-bills/{bill_id}/save-results/",
        {"work_item_order": reversed_order},
        format="json",
    )
    assert save_res.status_code == 200, save_res.data
    names = [row["test_name"] for row in save_res.data["work_items"]]
    assert names == ["Gamma", "Alpha", "Beta"]

    from apps.billing.models import Bill

    bill = Bill.objects.get(pk=bill_id)
    assert bill.lab_result_work_order == reversed_order
    assert [item.test_name for item in build_lab_result_work_items(bill)] == [
        "Gamma",
        "Alpha",
        "Beta",
    ]
