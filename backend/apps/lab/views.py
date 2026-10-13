from apps.core import permissions as perms
from apps.core.permissions_classes import HasAnyPerm, HasPerm
from apps.core.views.base import CoreModelViewSet
from apps.lab.filters import LabTestFilter, TestDepartmentFilter
from apps.lab.models import LabTest, TestDepartment
from apps.lab.serializers import LabTestSerializer, TestDepartmentSerializer


class TestDepartmentViewSet(CoreModelViewSet):
    serializer_class = TestDepartmentSerializer
    filterset_class = TestDepartmentFilter
    search_fields = ["name", "code"]
    ordering_fields = ["name", "created_at"]
    permission_classes = [HasPerm(perms.LAB_VIEW_TEST)]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [HasAnyPerm(perms.LAB_ADD_ORDER, perms.LAB_VIEW_TEST)()]
        return super().get_permissions()

    def get_queryset(self):
        qs = TestDepartment.objects.select_related("branch", "created_by", "updated_by").filter(
            is_active=True
        )
        return self.get_branch_filtered_queryset(qs)


class LabTestViewSet(CoreModelViewSet):
    serializer_class = LabTestSerializer
    filterset_class = LabTestFilter
    search_fields = ["name", "code"]
    ordering_fields = ["name", "created_at", "code"]
    permission_classes = [HasPerm(perms.LAB_VIEW_TEST)]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [HasAnyPerm(perms.LAB_ADD_ORDER, perms.LAB_VIEW_TEST)()]
        return super().get_permissions()

    def get_queryset(self):
        qs = LabTest.objects.select_related(
            "branch", "department", "created_by", "updated_by"
        ).filter(is_active=True)
        return self.get_branch_filtered_queryset(qs)
