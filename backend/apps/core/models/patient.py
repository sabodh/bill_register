from datetime import date

from django.db import models

from apps.core.models.base import BranchScopedModel


class Gender(models.TextChoices):
    MALE = "M", "Male"
    FEMALE = "F", "Female"
    OTHER = "O", "Other"


class Patient(BranchScopedModel):
    uhid = models.CharField(max_length=32, unique=True, db_index=True)
    name = models.CharField(max_length=200, db_index=True)
    gender = models.CharField(max_length=1, choices=Gender.choices)
    date_of_birth = models.DateField(null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True, db_index=True)
    address = models.TextField(blank=True)
    file_number = models.CharField(max_length=50, blank=True, db_index=True)
    doctor = models.ForeignKey(
        "core.Doctor",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="patients",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["name"]),
            models.Index(fields=["phone"]),
            models.Index(fields=["uhid"]),
        ]

    def __str__(self) -> str:
        return f"{self.uhid} - {self.name}"

    @property
    def age_years(self) -> int | None:
        if not self.date_of_birth:
            return None
        today = date.today()
        return (
            today.year
            - self.date_of_birth.year
            - ((today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day))
        )
