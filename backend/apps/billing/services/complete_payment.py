from rest_framework.exceptions import ValidationError

from apps.billing.models import Bill, BillStatus
from apps.billing.services.balance import balance_due_for_bill


def complete_bill_payment(bill: Bill, user) -> Bill:
    if bill.status == BillStatus.CANCELLED:
        raise ValidationError("Cannot complete payment on a cancelled bill.")
    if balance_due_for_bill(bill) <= 0:
        raise ValidationError("Bill is already paid in full.")
    bill.advance_paid = bill.total_amount
    bill.updated_by = user
    bill.save(update_fields=["advance_paid", "updated_by"])
    return bill
