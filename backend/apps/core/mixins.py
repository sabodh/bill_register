from django.db.models import QuerySet

from apps.core import permissions as perms


class BranchFilterMixin:
    """Restrict queryset to the user's branch unless they can view all branches."""

    branch_field = "branch"

    def get_branch_filtered_queryset(self, queryset: QuerySet) -> QuerySet:
        user = self.request.user
        if user.has_perm(perms.CORE_VIEW_ALL_BRANCHES) or user.is_superuser:
            return queryset
        if user.branch_id:
            return queryset.filter(**{self.branch_field: user.branch_id})
        return queryset.none()
