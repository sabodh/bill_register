from decimal import Decimal

from django.db import models

from apps.core.models.base import BranchScopedModel


class Doctor(BranchScopedModel):
    department = models.ForeignKey(
        "core.DoctorDepartment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="doctors",
    )
    name = models.CharField(max_length=200)
    consultation_fee = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("500.00"),
        help_text="Default OP / registration doctor fee",
    )
    revisit_period_days = models.PositiveSmallIntegerField(
        default=0,
        help_text="Free consultation revisit window after last visit with this doctor (0 = always charge).",
    )
    qualification = models.CharField(max_length=200, blank=True)
    specialization = models.CharField(max_length=200, blank=True)
    registration_number = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    is_referral = models.BooleanField(default=False)
    hospital_clinic_name = models.CharField(
        max_length=255,
        blank=True,
        help_text="Hospital/clinic name for referral reports",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name
