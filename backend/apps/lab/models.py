from decimal import Decimal

from django.db import models

from apps.core.models.base import BranchScopedModel


class TestDepartment(BranchScopedModel):
    name = models.CharField(max_length=120)
    code = models.CharField(max_length=32, blank=True, db_index=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["branch", "name"],
                name="lab_testdept_branch_name_uniq",
            ),
        ]

    def __str__(self) -> str:
        return self.name


class LabTest(BranchScopedModel):
    department = models.ForeignKey(
        TestDepartment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tests",
    )
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=32, blank=True, db_index=True)
    default_rate = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "lab test"
        verbose_name_plural = "lab tests"

    def __str__(self) -> str:
        return self.name
