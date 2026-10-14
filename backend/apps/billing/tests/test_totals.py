from decimal import Decimal

from apps.billing.models import DiscountType
from apps.billing.services.totals import compute_bill_totals


def test_percent_discount_only():
    subtotal, from_pct, applied, total = compute_bill_totals(
        Decimal("1000"), DiscountType.PERCENT, Decimal("10"), Decimal("0")
    )
    assert from_pct == Decimal("100.00")
    assert applied == Decimal("100.00")
    assert total == Decimal("900.00")


def test_amount_discount_only():
    _, from_pct, applied, total = compute_bill_totals(
        Decimal("1000"), DiscountType.AMOUNT, Decimal("0"), Decimal("150")
    )
    assert from_pct == Decimal("0")
    assert applied == Decimal("150.00")
    assert total == Decimal("850.00")


def test_discount_capped_at_subtotal():
    _, _, applied, total = compute_bill_totals(
        Decimal("100"), DiscountType.AMOUNT, Decimal("0"), Decimal("200")
    )
    assert applied == Decimal("100.00")
    assert total == Decimal("0.00")
