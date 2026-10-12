from rest_framework import viewsets

from apps.core.audit import AuditLogMixin
from apps.core.mixins import BranchFilterMixin


class CoreModelViewSet(AuditLogMixin, BranchFilterMixin, viewsets.ModelViewSet):
    """Base viewset with branch scoping and audit logging."""

    def get_queryset(self):
        qs = super().get_queryset()
        return self.get_branch_filtered_queryset(qs)

    def perform_destroy(self, instance):
        if hasattr(instance, "is_active"):
            instance.is_active = False
            instance.updated_by = self.request.user
            instance.save(update_fields=["is_active", "updated_by", "updated_at"])
            self._log_audit("soft_delete", instance, {"is_active": False})
        else:
            super().perform_destroy(instance)
