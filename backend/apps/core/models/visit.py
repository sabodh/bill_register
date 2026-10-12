from django.db import models

from apps.core.models.base import TimeStampedModel


class VisitType(models.TextChoices):
    LAB = "LAB", "Lab"
    OP = "OP", "Outpatient"
    EMERGENCY = "EMERGENCY", "Emergency"


class Visit(TimeStampedModel):
    patient = models.ForeignKey("core.Patient", on_delete=models.PROTECT, related_name="visits")
    visit_type = models.CharField(max_length=20, choices=VisitType.choices)
    branch = models.ForeignKey("core.Branch", on_delete=models.PROTECT, related_name="visits")

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.patient.uhid} - {self.visit_type} @ {self.created_at:%Y-%m-%d}"
