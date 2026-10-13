from django.db import models

from apps.core.models.base import BranchScopedModel


class StaffDepartment(BranchScopedModel):
    name = models.CharField(max_length=120)
    code = models.CharField(max_length=32, blank=True, db_index=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "staff department"
        verbose_name_plural = "staff departments"
        constraints = [
            models.UniqueConstraint(
                fields=["branch", "name"],
                name="core_staffdept_branch_name_uniq",
            ),
        ]

    def __str__(self) -> str:
        return self.name
