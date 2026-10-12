from django.conf import settings
from django.db import transaction
from django.db.models import Max

from apps.core.models import Patient


def generate_uhid() -> str:
    prefix = settings.UHID_PREFIX
    with transaction.atomic():
        last = (
            Patient.objects.filter(uhid__startswith=f"{prefix}-")
            .aggregate(m=Max("uhid"))
            .get("m")
        )
        if last:
            try:
                num = int(last.split("-")[-1]) + 1
            except ValueError:
                num = Patient.objects.count() + 1
        else:
            num = 1
        return f"{prefix}-{num:06d}"
