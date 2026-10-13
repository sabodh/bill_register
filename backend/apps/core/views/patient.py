from decimal import Decimal

from apps.billing.models import BillingItem
from apps.core import permissions as perms
from apps.core.filters import PatientFilter
from apps.core.models import Patient
from apps.core.permissions_classes import HasPerm
from apps.core.serializers import PatientSerializer
from apps.core.views.base import CoreModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response


class PatientViewSet(CoreModelViewSet):
    serializer_class = PatientSerializer
    filterset_class = PatientFilter
    search_fields = ["name", "phone", "uhid", "file_number"]
    ordering_fields = ["created_at", "name", "uhid"]
    permission_classes = [HasPerm(perms.CORE_VIEW_PATIENT)]

    def get_permissions(self):
        if self.action in ("create",):
            return [HasPerm(perms.CORE_ADD_PATIENT)()]
        if self.action in ("update", "partial_update", "destroy"):
            return [HasPerm(perms.CORE_CHANGE_PATIENT)()]
        return super().get_permissions()

    def get_queryset(self):
        qs = Patient.objects.select_related(
            "branch", "created_by", "updated_by", "doctor"
        ).filter(is_active=True)
        return self.get_branch_filtered_queryset(qs)

    @action(detail=False, methods=["get"], url_path="registration-fees")
    def registration_fees(self, request):
        branch_id = request.user.branch_id
        reg_item = None
        if branch_id:
            reg_item = BillingItem.objects.filter(
                branch_id=branch_id, code="OP-REG", is_active=True
            ).first()
        if not reg_item:
            reg_item = BillingItem.objects.filter(code="OP-REG", is_active=True).first()
        fee = reg_item.default_rate if reg_item else Decimal("0")
        return Response(
            {
                "registration_fee": str(fee),
                "registration_item_id": reg_item.id if reg_item else None,
                "consultation_item_id": BillingItem.objects.filter(code="OP-CONS")
                .values_list("id", flat=True)
                .first(),
            }
        )
