from django.db import models

from apps.core.models.base import BranchScopedModel


class DoctorDepartment(BranchScopedModel):
    name = models.CharField(max_length=120)
    code = models.CharField(max_length=32, blank=True, db_index=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "doctor department"
        verbose_name_plural = "doctor departments"
        constraints = [
            models.UniqueConstraint(
                fields=["branch", "name"],
                name="core_doctordept_branch_name_uniq",
            ),
        ]

    def __str__(self) -> str:
        return self.name
