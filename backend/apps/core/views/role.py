from django.contrib.auth.models import Group
from rest_framework import viewsets

from apps.core import permissions as perms
from apps.core.permissions_classes import HasPerm
from apps.core.serializers import RoleSerializer


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.prefetch_related("permissions__content_type").all()
    serializer_class = RoleSerializer
    search_fields = ["name"]
    ordering_fields = ["name"]
    permission_classes = [HasPerm(perms.CORE_VIEW_ROLE)]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [HasPerm(perms.CORE_MANAGE_ROLE)()]
        return super().get_permissions()
