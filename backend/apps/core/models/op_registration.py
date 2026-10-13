from django.db import models

from apps.core.models.base import BranchScopedModel


class RegistrationKind(models.TextChoices):
    NEW_OP = "NEW_OP", "New OP"
    REVISIT = "REVISIT", "Revisit"


class OpRegistration(BranchScopedModel):
    """One OP desk registration (new or revisit) for token and daily stats."""

    patient = models.ForeignKey(
        "core.Patient",
        on_delete=models.PROTECT,
        related_name="op_registrations",
    )
    doctor = models.ForeignKey(
        "core.Doctor",
        on_delete=models.PROTECT,
        related_name="op_registrations",
    )
    registration_kind = models.CharField(
        max_length=16,
        choices=RegistrationKind.choices,
        db_index=True,
    )
    op_token = models.PositiveIntegerField()

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["doctor", "created_at"]),
            models.Index(fields=["branch", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.patient.uhid} — {self.registration_kind} — token {self.op_token}"
