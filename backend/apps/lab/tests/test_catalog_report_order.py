import pytest

from apps.lab.models import LabTest, TestDepartment
from apps.lab.services.catalog_report_order import save_catalog_report_order
from apps.lab.services.result_worklist import build_lab_result_work_items


@pytest.mark.django_db
def test_catalog_order_sorts_result_work_items(auth_client, branch, admin_user):
    from apps.core.models import Patient

    hematology = TestDepartment.objects.create(
        name="Hematology",
        code="HEM",
        branch=branch,
        sort_order=0,
        created_by=admin_user,
        updated_by=admin_user,
    )
    biochem = TestDepartment.objects.create(
        name="Biochemistry",
        code="BIO",
        branch=branch,
        sort_order=1,
        created_by=admin_user,
        updated_by=admin_user,
    )
    hb = LabTest.objects.create(
        name="Hemoglobin",
        code="HB",
        branch=branch,
        department=hematology,
        sort_order=0,
        created_by=admin_user,
        updated_by=admin_user,
        default_rate="100.00",
    )
    glucose = LabTest.objects.create(
        name="Glucose",
        code="GLU",
        branch=branch,
        department=biochem,
        sort_order=0,
        created_by=admin_user,
        updated_by=admin_user,
        default_rate="100.00",
    )
    patient = Patient.objects.create(
        name="Sort Patient",
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
                    "lab_test": glucose.id,
                    "description": glucose.name,
                    "quantity": "1",
                    "unit_price": "100.00",
                },
                {
                    "lab_test": hb.id,
                    "description": hb.name,
                    "quantity": "1",
                    "unit_price": "100.00",
                },
            ],
        },
        format="json",
    )
    assert create_res.status_code == 201, create_res.data
    bill_id = create_res.data["id"]

    from apps.billing.models import Bill

    bill = Bill.objects.get(pk=bill_id)
    names = [item.test_name for item in build_lab_result_work_items(bill)]
    assert names == ["Hemoglobin", "Glucose"]

    save_catalog_report_order(
        branch_id=branch.id,
        department_ids=[biochem.id, hematology.id],
        test_ids=[glucose.id, hb.id],
    )
    biochem.refresh_from_db()
    hematology.refresh_from_db()
    assert biochem.sort_order == 0
    assert hematology.sort_order == 1

    names = [item.test_name for item in build_lab_result_work_items(bill)]
    assert names == ["Glucose", "Hemoglobin"]


@pytest.mark.django_db
def test_save_report_catalog_order_api(auth_client, branch, admin_user):
    dept = TestDepartment.objects.create(
        name="Serology",
        code="SER",
        branch=branch,
        created_by=admin_user,
        updated_by=admin_user,
    )
    test = LabTest.objects.create(
        name="CRP",
        code="CRP",
        branch=branch,
        department=dept,
        created_by=admin_user,
        updated_by=admin_user,
        default_rate="50.00",
    )
    res = auth_client.post(
        "/api/lab/tests/save-report-catalog-order/",
        {"department_ids": [dept.id], "test_ids": [test.id]},
        format="json",
    )
    assert res.status_code == 200, res.data
    dept.refresh_from_db()
    test.refresh_from_db()
    assert dept.sort_order == 0
    assert test.sort_order == 0
