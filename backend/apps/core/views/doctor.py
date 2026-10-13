from django.db.models import Count, Max, Q
from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core import permissions as perms
from apps.core.filters import DoctorFilter
from apps.core.models import Doctor, OpRegistration, RegistrationKind
from apps.core.permissions_classes import HasPerm
from apps.core.serializers import DoctorSerializer
from apps.core.views.base import CoreModelViewSet


class DoctorViewSet(CoreModelViewSet):
    serializer_class = DoctorSerializer
    filterset_class = DoctorFilter
    search_fields = ["name", "phone", "registration_number", "specialization"]
    ordering_fields = ["name", "created_at"]
    permission_classes = [HasPerm(perms.CORE_VIEW_DOCTOR)]

    def get_permissions(self):
        if self.action in ("create",):
            return [HasPerm(perms.CORE_ADD_DOCTOR)()]
        if self.action in ("update", "partial_update", "destroy"):
            return [HasPerm(perms.CORE_CHANGE_DOCTOR)()]
        return super().get_permissions()

    def get_queryset(self):
        qs = Doctor.objects.select_related(
            "branch", "created_by", "updated_by", "department"
        ).filter(is_active=True)
        return self.get_branch_filtered_queryset(qs)

    @action(detail=False, methods=["get"], url_path="op-tokens")
    def op_tokens(self, request):
        """Per-doctor OP token summary for today (registration desk board)."""
        today = timezone.localdate()
        reg_qs = OpRegistration.objects.filter(created_at__date=today)
        reg_qs = self.get_branch_filtered_queryset(reg_qs)
        stats = {
            row["doctor_id"]: row
            for row in reg_qs.values("doctor_id").annotate(
                admissions_today=Count("id"),
                last_token=Max("op_token"),
                new_op=Count("id", filter=Q(registration_kind=RegistrationKind.NEW_OP)),
                revisit=Count("id", filter=Q(registration_kind=RegistrationKind.REVISIT)),
            )
        }
        summary_row = reg_qs.aggregate(
            total_registrations=Count("id"),
            new_op=Count("id", filter=Q(registration_kind=RegistrationKind.NEW_OP)),
            revisit=Count("id", filter=Q(registration_kind=RegistrationKind.REVISIT)),
        )
        doctors = self.get_queryset().filter(is_referral=False).order_by("name")
        doctor_payload = []
        for doctor in doctors:
            row = stats.get(doctor.id, {})
            admissions = int(row.get("admissions_today") or 0)
            last_token = int(row.get("last_token") or 0)
            doctor_payload.append(
                {
                    "id": doctor.id,
                    "name": doctor.name,
                    "specialization": doctor.specialization,
                    "current_token": last_token,
                    "admissions_today": admissions,
                    "new_op": int(row.get("new_op") or 0),
                    "revisit": int(row.get("revisit") or 0),
                }
            )
        return Response(
            {
                "summary": {
                    "total_registrations": int(summary_row.get("total_registrations") or 0),
                    "new_op": int(summary_row.get("new_op") or 0),
                    "revisit": int(summary_row.get("revisit") or 0),
                },
                "doctors": doctor_payload,
            }
        )
