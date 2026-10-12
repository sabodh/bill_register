from decimal import Decimal

from django.db import models

from apps.core.models.base import AuditFieldsModel, BranchScopedModel


class ItemType(models.TextChoices):
    LAB = "LAB", "Lab"
    OP = "OP", "Outpatient"
    PHARMACY = "PHARMACY", "Pharmacy"
    OTHER = "OTHER", "Other"


class BillingItem(BranchScopedModel):
    """Billable product/service master (shared catalog; line items reference item_type)."""

    code = models.CharField(max_length=50)
    name = models.CharField(max_length=200, db_index=True)
    item_type = models.CharField(max_length=20, choices=ItemType.choices, default=ItemType.OTHER)
    default_rate = models.DecimalField(max_digits=12, decimal_places=2)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        unique_together = [("branch", "code")]

    def __str__(self) -> str:
        return self.name


class BillStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    FINAL = "FINAL", "Final"


class Bill(BranchScopedModel):
    bill_number = models.CharField(max_length=32, unique=True, db_index=True)
    patient = models.ForeignKey(
        "core.Patient",
        on_delete=models.PROTECT,
        related_name="bills",
        null=True,
        blank=True,
    )
    status = models.CharField(max_length=20, choices=BillStatus.choices, default=BillStatus.DRAFT)
    total_amount = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal("0"))
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.bill_number


class BillLine(models.Model):
    bill = models.ForeignKey(Bill, on_delete=models.CASCADE, related_name="lines")
    billing_item = models.ForeignKey(
        BillingItem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="bill_lines",
    )
    item_type = models.CharField(max_length=20, choices=ItemType.choices, default=ItemType.OTHER)
    description = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("1"))
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self) -> str:
        return f"{self.description} ({self.amount})"
