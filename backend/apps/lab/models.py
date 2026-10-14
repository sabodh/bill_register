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


class TestType(models.TextChoices):
    NORMAL = "NORMAL", "Normal"
    SUBTEST = "SUBTEST", "Subtest"
    SPECIAL = "SPECIAL", "Special test"
    MULTIPLE_REFERENCE = "MULTIPLE_REFERENCE", "Has multiple reference range"


class ReferenceRowRole(models.TextChoices):
    """How a reference row is used on result entry / PDF."""

    SINGLE = "SINGLE", "Single analyte"
    SUBTEST = "SUBTEST", "Panel subtest line"
    VARIANT = "VARIANT", "Reference variant (e.g. sex / age band)"


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
    method_name = models.CharField(max_length=200, blank=True)
    test_type = models.CharField(
        max_length=32,
        choices=TestType.choices,
        default=TestType.NORMAL,
    )
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


class LabTestReferenceRange(models.Model):
    test = models.ForeignKey(
        LabTest,
        on_delete=models.CASCADE,
        related_name="reference_ranges",
    )
    role = models.CharField(
        max_length=16,
        choices=ReferenceRowRole.choices,
        default=ReferenceRowRole.SINGLE,
    )
    result_group = models.CharField(
        max_length=32,
        default="main",
        help_text="Rows sharing a group use one analysed result (e.g. all VARIANT rows).",
    )
    reference_text = models.CharField(max_length=255, blank=True)
    low_value = models.DecimalField(
        max_digits=14,
        decimal_places=4,
        null=True,
        blank=True,
    )
    high_value = models.DecimalField(
        max_digits=14,
        decimal_places=4,
        null=True,
        blank=True,
    )
    unit = models.CharField(max_length=32, blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self) -> str:
        return self.reference_text or f"Range {self.id}"


class LabPackage(BranchScopedModel):
    name = models.CharField(max_length=200, db_index=True)
    package_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["branch", "name"],
                name="lab_package_branch_name_uniq",
            ),
        ]

    def __str__(self) -> str:
        return self.name


class LabPackageItem(models.Model):
    package = models.ForeignKey(
        LabPackage,
        on_delete=models.CASCADE,
        related_name="items",
    )
    test = models.ForeignKey(
        LabTest,
        on_delete=models.PROTECT,
        related_name="package_items",
    )
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["package", "test"],
                name="lab_package_item_package_test_uniq",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.package.name} — {self.test.name}"


class LabTestInterpretation(models.Model):
    test = models.ForeignKey(
        LabTest,
        on_delete=models.CASCADE,
        related_name="interpretations",
    )
    note = models.TextField(blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self) -> str:
        return (self.note[:40] + "…") if len(self.note) > 40 else self.note
