import pytest

from apps.lab.models import LabTest, TestDepartment


@pytest.mark.django_db
def test_lab_bill_report_by_doctor(auth_client, branch, admin_user):
    from apps.core.models import Doctor, Patient

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
    doctor = Doctor.objects.create(
        name="Dr A",
        branch=branch,
        created_by=admin_user,
        updated_by=admin_user,
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
            "doctor": doctor.id,
            "doctor_name": doctor.name,
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

    list_res = auth_client.get("/api/reports/lab-bills/")
    assert list_res.status_code == 200, list_res.data
    assert list_res.data["summary"]["bill_count"] >= 1

    doctor_res = auth_client.get("/api/reports/lab-bills/by-doctor/")
    assert doctor_res.status_code == 200, doctor_res.data
    assert any(row["doctor_name"] == "Dr A" for row in doctor_res.data["rows"])

    hospital_res = auth_client.get("/api/reports/lab-bills/by-hospital/")
    assert hospital_res.status_code == 200, hospital_res.data

    search_res = auth_client.get("/api/reports/lab-bills/", {"search": "Test Patient"})
    assert search_res.status_code == 200, search_res.data
    assert search_res.data["summary"]["bill_count"] >= 1
    assert any(row.get("patient_name") == "Test Patient" for row in search_res.data["rows"])

    miss_res = auth_client.get("/api/reports/lab-bills/", {"search": "no-such-patient-xyz"})
    assert miss_res.status_code == 200
    assert miss_res.data["summary"]["bill_count"] == 0
