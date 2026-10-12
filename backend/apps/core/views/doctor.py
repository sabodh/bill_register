from apps.core import permissions as perms
from apps.core.filters import DoctorFilter
from apps.core.models import Doctor
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
        qs = Doctor.objects.select_related("branch", "created_by", "updated_by").filter(
            is_active=True
        )
        return self.get_branch_filtered_queryset(qs)
