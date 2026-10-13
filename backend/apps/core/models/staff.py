from django.conf import settings
from django.db import models

from apps.core.models.base import BranchScopedModel
from apps.core.models.patient import Gender


class Staff(BranchScopedModel):
    department = models.ForeignKey(
        "core.StaffDepartment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="staff_members",
    )
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="staff_profile",
    )
    employee_id = models.CharField(max_length=50, blank=True, db_index=True)
    name = models.CharField(max_length=200, blank=True, db_index=True)
    gender = models.CharField(max_length=1, choices=Gender.choices, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True, db_index=True, help_text="Mobile number")
    alternative_phone = models.CharField(max_length=20, blank=True)
    aadhar_number = models.CharField(max_length=12, blank=True, db_index=True)
    designation = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["employee_id", "id"]
        verbose_name_plural = "staff"

    def __str__(self) -> str:
        if self.name:
            return self.name
        if self.user:
            return self.user.get_full_name() or self.user.username
        return self.employee_id or f"Staff #{self.pk}"
