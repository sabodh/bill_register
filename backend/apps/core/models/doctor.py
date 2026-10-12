from django.db import models

from apps.core.models.base import BranchScopedModel


class Doctor(BranchScopedModel):
    name = models.CharField(max_length=200)
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
