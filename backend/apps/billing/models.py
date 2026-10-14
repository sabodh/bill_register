from decimal import Decimal

from django.db import models
from django.utils import timezone

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
    CANCELLED = "CANCELLED", "Cancelled"


class DiscountType(models.TextChoices):
    NONE = "NONE", "None"
    PERCENT = "PERCENT", "Percent"
    AMOUNT = "AMOUNT", "Amount"


class PaymentMethod(models.TextChoices):
    CASH = "CASH", "Cash"
    UPI = "UPI", "UPI"
    CARD = "CARD", "Card"
    CREDIT = "CREDIT", "Credit"


class Bill(BranchScopedModel):
    bill_number = models.CharField(max_length=32, unique=True, db_index=True)
    patient = models.ForeignKey(
        "core.Patient",
        on_delete=models.PROTECT,
        related_name="bills",
        null=True,
        blank=True,
    )
    doctor = models.ForeignKey(
        "core.Doctor",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="bills",
    )
    doctor_name = models.CharField(
        max_length=200,
        blank=True,
        help_text="Doctor name printed on the bill (may differ from the linked doctor).",
    )
    hospital = models.ForeignKey(
        "core.Branch",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="hospital_bills",
        help_text="Hospital printed on the bill (defaults to the bill branch).",
    )
    hospital_name = models.CharField(
        max_length=200,
        blank=True,
        help_text="Hospital name printed on the bill (may differ from the linked branch).",
    )
    sample_collected_at = models.DateTimeField(
        default=timezone.now,
        help_text="Sample collection date and time for lab reports.",
    )
    sample_tested_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Date and time when sample testing was completed (lab results).",
    )
    status = models.CharField(max_length=20, choices=BillStatus.choices, default=BillStatus.DRAFT)
    subtotal_amount = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal("0"))
    discount_type = models.CharField(
        max_length=16,
        choices=DiscountType.choices,
        default=DiscountType.NONE,
    )
    discount_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("0"),
        help_text="Used when discount_type is PERCENT",
    )
    discount_amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0"),
        help_text="Used when discount_type is AMOUNT",
    )
    discount_applied = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0"),
        help_text="Total discount deducted (capped at subtotal)",
    )
    total_amount = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal("0"))
    advance_paid = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0"),
        help_text="Amount paid in advance toward this bill.",
    )
    payment_method = models.CharField(
        max_length=16,
        choices=PaymentMethod.choices,
        default=PaymentMethod.CASH,
    )
    payment_transaction_id = models.CharField(max_length=100, blank=True)
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
    lab_test = models.ForeignKey(
        "lab.LabTest",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="bill_lines",
    )
    lab_package = models.ForeignKey(
        "lab.LabPackage",
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
