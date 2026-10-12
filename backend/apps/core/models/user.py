from django.contrib.auth.models import AbstractUser
from django.db import models

from apps.core.models.base import TimeStampedModel


class User(AbstractUser, TimeStampedModel):
    phone = models.CharField(max_length=20, blank=True)
    branch = models.ForeignKey(
        "core.Branch",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users",
    )

    class Meta:
        permissions = [
            ("view_role", "Can view roles"),
            ("manage_role", "Can manage roles"),
        ]

    def __str__(self) -> str:
        return self.username

    def get_permission_codenames(self) -> list[str]:
        return sorted(self.get_all_permissions())
