from apps.core import permissions as perms
from apps.core.filters import StaffFilter
from apps.core.models import Staff
from apps.core.permissions_classes import HasPerm
from apps.core.serializers import StaffSerializer
from apps.core.views.base import CoreModelViewSet


class StaffViewSet(CoreModelViewSet):
    serializer_class = StaffSerializer
    filterset_class = StaffFilter
    search_fields = ["employee_id", "designation", "phone", "user__username"]
    ordering_fields = ["employee_id", "created_at"]
    permission_classes = [HasPerm(perms.CORE_VIEW_STAFF)]

    def get_permissions(self):
        if self.action in ("create",):
            return [HasPerm(perms.CORE_ADD_STAFF)()]
        if self.action in ("update", "partial_update", "destroy"):
            return [HasPerm(perms.CORE_CHANGE_STAFF)()]
        return super().get_permissions()

    def get_queryset(self):
        qs = Staff.objects.select_related("branch", "user", "created_by", "updated_by").filter(
            is_active=True
        )
        return self.get_branch_filtered_queryset(qs)
