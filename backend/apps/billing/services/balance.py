from decimal import Decimal

from apps.billing.models import Bill


def balance_due_for_bill(bill: Bill) -> Decimal:
    total = bill.total_amount or Decimal("0")
    advance = bill.advance_paid or Decimal("0")
    balance = total - advance
    if balance < 0:
        return Decimal("0")
    return balance
