from decimal import Decimal, ROUND_HALF_UP

from apps.billing.models import DiscountType

MONEY_QUANT = Decimal("0.01")


def compute_bill_totals(
    subtotal: Decimal,
    discount_type: str = DiscountType.NONE,
    discount_percent: Decimal | None = None,
    discount_amount: Decimal | None = None,
) -> tuple[Decimal, Decimal, Decimal, Decimal]:
    """Return (subtotal, discount_from_percent, discount_applied, total)."""
    subtotal = Decimal(subtotal).quantize(MONEY_QUANT, rounding=ROUND_HALF_UP)
    pct = Decimal(discount_percent or 0)
    flat = Decimal(discount_amount or 0)
    if pct < 0 or flat < 0:
        raise ValueError("Discount values cannot be negative")
    if pct > 100:
        raise ValueError("Discount percent cannot exceed 100")

    if discount_type == DiscountType.PERCENT:
        from_percent = (subtotal * pct / Decimal("100")).quantize(MONEY_QUANT, rounding=ROUND_HALF_UP)
        discount_applied = min(subtotal, from_percent)
    elif discount_type == DiscountType.AMOUNT:
        from_percent = Decimal("0")
        discount_applied = min(subtotal, flat.quantize(MONEY_QUANT, rounding=ROUND_HALF_UP))
    else:
        from_percent = Decimal("0")
        discount_applied = Decimal("0")

    total = (subtotal - discount_applied).quantize(MONEY_QUANT, rounding=ROUND_HALF_UP)
    return subtotal, from_percent, discount_applied, total
