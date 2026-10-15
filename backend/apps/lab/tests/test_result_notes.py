import pytest

from apps.billing.models import BillLine
from apps.lab.models import LabBillLineResult, LabTest, LabTestInterpretation, TestDepartment
from apps.lab.services.result_values import WORK_ITEM_RESULT_NOTE_KEY, storage_result_key


@pytest.mark.django_db
def test_result_note_saved_separately_from_master(auth_client, branch, admin_user):
    from apps.core.models import Patient

    dept = TestDepartment.objects.create(
        name="Bio",
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
        default_rate="500.00",
    )
    LabTestInterpretation.objects.create(test=test, note="Master interpretation line", sort_order=0)
    patient = Patient.objects.create(
        name="Note Patient",
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
                    "unit_price": "500.00",
                },
            ],
        },
        format="json",
    )
    assert create_res.status_code == 201, create_res.data
    bill_id = create_res.data["id"]
    line = BillLine.objects.get(bill_id=bill_id)

    detail_res = auth_client.get(f"/api/lab/result-bills/{bill_id}/")
    assert detail_res.status_code == 200
    work_item = detail_res.data["work_items"][0]
    assert work_item["default_notes"] == ["Master interpretation line"]

    save_res = auth_client.post(
        f"/api/lab/result-bills/{bill_id}/save-results/",
        {
            "results": [
                {
                    "bill_line_id": line.id,
                    "lab_test_id": test.id,
                    "result_key": WORK_ITEM_RESULT_NOTE_KEY,
                    "value": "Result-only note for this bill",
                },
            ],
        },
        format="json",
    )
    assert save_res.status_code == 200, save_res.data
    note_rows = [
        r
        for r in save_res.data["saved_results"]
        if r["result_key"] == WORK_ITEM_RESULT_NOTE_KEY
    ]
    assert note_rows == [
        {
            "bill_line_id": line.id,
            "lab_test_id": test.id,
            "result_key": WORK_ITEM_RESULT_NOTE_KEY,
            "value": "Result-only note for this bill",
        }
    ]
    assert LabBillLineResult.objects.filter(
        bill_line_id=line.id,
        result_key=storage_result_key(test.id, WORK_ITEM_RESULT_NOTE_KEY),
        value="Result-only note for this bill",
    ).exists()
    test.interpretations.update(note="Master interpretation line")
    assert test.interpretations.first().note == "Master interpretation line"
