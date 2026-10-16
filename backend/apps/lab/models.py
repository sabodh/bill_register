from decimal import Decimal

from django.db import models

from apps.core.models.base import BranchScopedModel


class TestDepartment(BranchScopedModel):
    name = models.CharField(max_length=120)
    code = models.CharField(max_length=32, blank=True, db_index=True)
    sort_order = models.PositiveIntegerField(
        default=0,
        help_text="Order of department sections on patient lab reports.",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["sort_order", "name"]
        constraints = [
            models.UniqueConstraint(
                fields=["branch", "name"],
                name="lab_testdept_branch_name_uniq",
            ),
        ]

    def __str__(self) -> str:
        return self.name


class TestCategory(models.TextChoices):
    NORMAL = "NORMAL", "Normal"
    SUBTEST = "SUBTEST", "Subtest"
    SPECIAL = "SPECIAL", "Special test"
    MULTIPLE_REFERENCE = "MULTIPLE_REFERENCE", "Has multiple reference range"


# Backwards-compatible alias used in services and tests.
TestType = TestCategory


class LabTestType(models.TextChoices):
    TYPE_1 = "TYPE_1", "Type-1"
    TYPE_2 = "TYPE_2", "Type-2"
    TYPE_3 = "TYPE_3", "Type-3"
    TYPE_4 = "TYPE_4", "Type-4"
    TYPE_5 = "TYPE_5", "Type-5"
    TYPE_6 = "TYPE_6", "Type-6"
    TYPE_7 = "TYPE_7", "Type-7"
    TYPE_8 = "TYPE_8", "Type-8"
    TYPE_9 = "TYPE_9", "Type-9"
    TYPE_10 = "TYPE_10", "Type-10"


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
    test_category = models.CharField(
        max_length=32,
        choices=TestCategory.choices,
        default=TestCategory.NORMAL,
    )
    test_type = models.CharField(
        max_length=16,
        choices=LabTestType.choices,
        default=LabTestType.TYPE_1,
    )
    default_rate = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    sort_order = models.PositiveIntegerField(
        default=0,
        help_text="Order of tests within a department on patient lab reports.",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["sort_order", "name"]
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


class LabBillLineResult(models.Model):
    """Entered result value for one field on a bill line (panel row, single analyte, etc.)."""

    bill_line = models.ForeignKey(
        "billing.BillLine",
        on_delete=models.CASCADE,
        related_name="lab_result_values",
    )
    result_key = models.CharField(max_length=64)
    value = models.TextField(blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["bill_line", "result_key"],
                name="lab_bill_line_result_line_key_uniq",
            ),
        ]

    def __str__(self) -> str:
        return f"line {self.bill_line_id} / {self.result_key}"
