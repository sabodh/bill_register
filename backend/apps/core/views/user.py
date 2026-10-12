from rest_framework import viewsets

from apps.core import permissions as perms
from apps.core.filters import UserFilter
from apps.core.mixins import BranchFilterMixin
from apps.core.models import User
from apps.core.permissions_classes import HasPerm
from apps.core.serializers import UserSerializer


class UserViewSet(BranchFilterMixin, viewsets.ModelViewSet):
    serializer_class = UserSerializer
    filterset_class = UserFilter
    search_fields = ["username", "email", "first_name", "last_name", "phone"]
    ordering_fields = ["username", "date_joined"]
    permission_classes = [HasPerm(perms.CORE_VIEW_USER)]

    def get_permissions(self):
        if self.action in ("create",):
            return [HasPerm(perms.CORE_ADD_USER)()]
        if self.action in ("update", "partial_update", "destroy"):
            return [HasPerm(perms.CORE_CHANGE_USER)()]
        return super().get_permissions()

    def get_queryset(self):
        qs = User.objects.select_related("branch").prefetch_related("groups")
        return self.get_branch_filtered_queryset(qs)
