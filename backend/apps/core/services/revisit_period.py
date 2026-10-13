from datetime import timedelta

from django.utils import timezone

from apps.core.models import Doctor, OpRegistration, Patient


def last_op_registration_for_doctor(patient_id: int, doctor_id: int) -> OpRegistration | None:
    return (
        OpRegistration.objects.filter(patient_id=patient_id, doctor_id=doctor_id)
        .order_by("-created_at")
        .first()
    )


def is_within_doctor_revisit_period(patient: Patient, doctor: Doctor) -> bool:
    period_days = doctor.revisit_period_days or 0
    if period_days <= 0:
        return False
    last = last_op_registration_for_doctor(patient.pk, doctor.pk)
    if not last:
        return False
    today = timezone.localdate()
    last_date = timezone.localtime(last.created_at).date()
    return (today - last_date) <= timedelta(days=period_days)


def effective_consultation_fee(patient: Patient | None, doctor: Doctor) -> tuple[str, bool]:
    """Return (fee amount as string, waived)."""
    base = doctor.consultation_fee
    if patient and is_within_doctor_revisit_period(patient, doctor):
        return ("0", True)
    return (str(base), False)
