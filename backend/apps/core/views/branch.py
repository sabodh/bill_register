from rest_framework import viewsets

from apps.core import permissions as perms
from apps.core.models import Branch
from apps.core.permissions_classes import HasPerm
from apps.core.serializers import BranchSerializer


class BranchViewSet(viewsets.ModelViewSet):
    serializer_class = BranchSerializer
    search_fields = ["name", "code"]
    ordering_fields = ["name"]
    permission_classes = [HasPerm(perms.CORE_VIEW_BRANCH)]

    def get_permissions(self):
        if self.action in ("create",):
            return [HasPerm(perms.CORE_ADD_BRANCH)()]
        if self.action in ("update", "partial_update", "destroy"):
            return [HasPerm(perms.CORE_CHANGE_BRANCH)()]
        return super().get_permissions()

    def get_queryset(self):
        return Branch.objects.filter(is_active=True).select_related("created_by", "updated_by")
