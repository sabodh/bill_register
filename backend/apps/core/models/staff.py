from django.conf import settings
from django.db import models

from apps.core.models.base import BranchScopedModel


class Staff(BranchScopedModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="staff_profile",
    )
    employee_id = models.CharField(max_length=50, blank=True)
    designation = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["employee_id", "id"]
        verbose_name_plural = "staff"

    def __str__(self) -> str:
        if self.user:
            return self.user.get_full_name() or self.user.username
        return self.employee_id or f"Staff #{self.pk}"
