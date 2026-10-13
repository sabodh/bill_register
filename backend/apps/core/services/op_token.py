from django.db.models import Max
from django.utils import timezone

from apps.core.models import OpRegistration, RegistrationKind


def next_op_token_for_doctor(branch_id: int, doctor_id: int) -> int:
    today = timezone.localdate()
    current_max = (
        OpRegistration.objects.filter(
            branch_id=branch_id,
            doctor_id=doctor_id,
            created_at__date=today,
        ).aggregate(m=Max("op_token"))["m"]
        or 0
    )
    return current_max + 1


def create_op_registration(
    *,
    patient,
    doctor,
    branch_id: int,
    registration_kind: str,
    user,
) -> OpRegistration:
    token = next_op_token_for_doctor(branch_id, doctor.pk)
    return OpRegistration.objects.create(
        patient=patient,
        doctor=doctor,
        branch_id=branch_id,
        registration_kind=registration_kind,
        op_token=token,
        created_by=user,
        updated_by=user,
    )
