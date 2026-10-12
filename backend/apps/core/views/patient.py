from apps.core import permissions as perms
from apps.core.filters import PatientFilter
from apps.core.models import Patient
from apps.core.permissions_classes import HasPerm
from apps.core.serializers import PatientSerializer
from apps.core.views.base import CoreModelViewSet


class PatientViewSet(CoreModelViewSet):
    serializer_class = PatientSerializer
    filterset_class = PatientFilter
    search_fields = ["name", "phone", "uhid"]
    ordering_fields = ["created_at", "name", "uhid"]
    permission_classes = [HasPerm(perms.CORE_VIEW_PATIENT)]

    def get_permissions(self):
        if self.action in ("create",):
            return [HasPerm(perms.CORE_ADD_PATIENT)()]
        if self.action in ("update", "partial_update", "destroy"):
            return [HasPerm(perms.CORE_CHANGE_PATIENT)()]
        return super().get_permissions()

    def get_queryset(self):
        qs = Patient.objects.select_related("branch", "created_by", "updated_by").filter(
            is_active=True
        )
        return self.get_branch_filtered_queryset(qs)
