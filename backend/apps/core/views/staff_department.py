from apps.core import permissions as perms
from apps.core.filters import StaffDepartmentFilter
from apps.core.models import StaffDepartment
from apps.core.permissions_classes import HasPerm
from apps.core.serializers.staff_department import StaffDepartmentSerializer
from apps.core.views.base import CoreModelViewSet


class StaffDepartmentViewSet(CoreModelViewSet):
    serializer_class = StaffDepartmentSerializer
    filterset_class = StaffDepartmentFilter
    search_fields = ["name", "code"]
    ordering_fields = ["name", "created_at"]
    permission_classes = [HasPerm(perms.CORE_VIEW_STAFF)]

    def get_permissions(self):
        if self.action in ("create",):
            return [HasPerm(perms.CORE_ADD_STAFF)()]
        if self.action in ("update", "partial_update", "destroy"):
            return [HasPerm(perms.CORE_CHANGE_STAFF)()]
        return super().get_permissions()

    def get_queryset(self):
        qs = StaffDepartment.objects.select_related("branch", "created_by", "updated_by").filter(
            is_active=True
        )
        return self.get_branch_filtered_queryset(qs)
