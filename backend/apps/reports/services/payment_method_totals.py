from __future__ import annotations

from decimal import Decimal
from typing import Any

from django.db.models import Q, Sum
from django.db.models.functions import Coalesce

from apps.billing.models import PaymentMethod


def collected_by_method_annotation_keys() -> list[str]:
    return [f"collected_{code.lower()}" for code, _ in PaymentMethod.choices]


def collected_by_method_annotations() -> dict[str, Any]:
    annotations: dict[str, Any] = {}
    for code, _ in PaymentMethod.choices:
        key = f"collected_{code.lower()}"
        annotations[key] = Coalesce(
            Sum("advance_paid", filter=Q(payment_method=code)),
            Decimal("0"),
        )
    return annotations


def serialize_collected_by_method(agg_row: dict[str, Any], money_fn) -> dict[str, str]:
    return {
        code: money_fn(agg_row.get(f"collected_{code.lower()}") or Decimal("0"))
        for code, _ in PaymentMethod.choices
    }


def row_collected_by_method_fields(agg_row: dict[str, Any], money_fn) -> dict[str, str]:
    return {
        f"collected_{code.lower()}": money_fn(agg_row.get(f"collected_{code.lower()}") or Decimal("0"))
        for code, _ in PaymentMethod.choices
    }
