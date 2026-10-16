from django.db import models

from apps.core.models.base import AuditFieldsModel


class Branch(AuditFieldsModel):
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, unique=True)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    report_letterhead = models.ImageField(
        upload_to="branch_letterheads/",
        blank=True,
        null=True,
        help_text="Letterhead image for printed lab reports (upload via Django admin).",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        permissions = [
            ("view_all_branches", "Can view data across all branches"),
        ]

    def __str__(self) -> str:
        return self.name
