from django.db import transaction
from django.db.models import Max

from apps.billing.models import Bill


def generate_bill_number() -> str:
    prefix = "BILL"
    with transaction.atomic():
        last = (
            Bill.objects.filter(bill_number__startswith=f"{prefix}-")
            .aggregate(m=Max("bill_number"))
            .get("m")
        )
        if last:
            try:
                num = int(last.split("-")[-1]) + 1
            except ValueError:
                num = Bill.objects.count() + 1
        else:
            num = 1
        return f"{prefix}-{num:06d}"
