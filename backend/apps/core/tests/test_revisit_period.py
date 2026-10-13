from datetime import timedelta

import pytest
from django.utils import timezone

from apps.core.models import Doctor, OpRegistration, Patient, RegistrationKind
from apps.core.services.op_token import create_op_registration
from apps.core.services.revisit_period import effective_consultation_fee, is_within_doctor_revisit_period


@pytest.fixture
def doctor(branch, admin_user):
    return Doctor.objects.create(
        name="Dr Test",
        branch=branch,
        consultation_fee=500,
        revisit_period_days=5,
        created_by=admin_user,
        updated_by=admin_user,
    )


@pytest.fixture
def patient(branch, admin_user):
    return Patient.objects.create(
        uhid="HMS-TEST-1",
        name="Test Patient",
        gender="M",
        branch=branch,
        created_by=admin_user,
        updated_by=admin_user,
    )


@pytest.mark.django_db
def test_revisit_period_waives_fee_within_window(branch, doctor, patient, admin_user):
    doctor.revisit_period_days = 5
    doctor.consultation_fee = 500
    doctor.save(update_fields=["revisit_period_days", "consultation_fee"])

    create_op_registration(
        patient=patient,
        doctor=doctor,
        branch_id=branch.id,
        registration_kind=RegistrationKind.NEW_OP,
        user=admin_user,
    )

    assert is_within_doctor_revisit_period(patient, doctor) is True
    fee, waived = effective_consultation_fee(patient, doctor)
    assert waived is True
    assert fee == "0"


@pytest.mark.django_db
def test_revisit_period_charges_after_window(branch, doctor, patient, admin_user):
    doctor.revisit_period_days = 5
    doctor.save(update_fields=["revisit_period_days"])

    reg = create_op_registration(
        patient=patient,
        doctor=doctor,
        branch_id=branch.id,
        registration_kind=RegistrationKind.NEW_OP,
        user=admin_user,
    )
    old = timezone.now() - timedelta(days=6)
    OpRegistration.objects.filter(pk=reg.pk).update(created_at=old)

    assert is_within_doctor_revisit_period(patient, doctor) is False
    fee, waived = effective_consultation_fee(patient, doctor)
    assert waived is False
    assert fee == str(doctor.consultation_fee)
