from __future__ import annotations

import re
from decimal import Decimal
from typing import Any

from django.db.models import Count, Q, Sum
from django.db.models.functions import Coalesce

from apps.billing.models import BillLine
from apps.lab.models import LabTestType


def _quantity_str(value: Decimal | None) -> str:
    if value is None:
        return "0"
    if value == value.to_integral_value():
        return str(int(value))
    return f"{value:.2f}"


def _test_type_label(code: str | None) -> str:
    if not code:
        return LabTestType.TYPE_1.label
    try:
        return LabTestType(code).label
    except ValueError:
        return code


def _test_type_search_filter(term: str) -> Q | None:
    stripped = term.strip()
    if not stripped:
        return None
    match = re.match(r"^type[-\s]?(\d{1,2})$", stripped, re.IGNORECASE)
    if match:
        return Q(lab_test__test_type=f"TYPE_{match.group(1)}")
    upper = stripped.upper().replace("-", "_").replace(" ", "_")
    if re.match(r"^TYPE_\d{1,2}$", upper):
        return Q(lab_test__test_type=upper)
    if upper.startswith("TYPE"):
        return Q(lab_test__test_type__icontains=upper)
    return None


def lab_test_count_lines_qs(bill_qs, search: str | None = None):
    qs = BillLine.objects.filter(bill__in=bill_qs, lab_test_id__isnull=False)
    term = (search or "").strip()
    if term:
        type_q = _test_type_search_filter(term)
        if type_q is not None:
            qs = qs.filter(type_q)
        else:
            qs = qs.filter(
                Q(lab_test__name__icontains=term)
                | Q(lab_test__code__icontains=term)
                | Q(lab_test__department__name__icontains=term)
                | Q(lab_test__department__code__icontains=term)
            )
    return qs


def summary_from_test_count_lines(lines_qs) -> dict[str, Any]:
    agg = lines_qs.aggregate(
        test_types=Count("lab_test_id", distinct=True),
        total_tests=Coalesce(Sum("quantity"), Decimal("0")),
    )
    total = agg["total_tests"] or Decimal("0")
    return {
        "test_types": agg["test_types"] or 0,
        "total_tests": _quantity_str(total),
    }


def lab_test_count_report(bill_qs, search: str | None = None) -> list[dict[str, Any]]:
    lines_qs = lab_test_count_lines_qs(bill_qs, search)
    grouped = (
        lines_qs.values(
            "lab_test_id",
            "lab_test__name",
            "lab_test__code",
            "lab_test__department__name",
            "lab_test__test_type",
        )
        .annotate(test_count=Coalesce(Sum("quantity"), Decimal("0")))
        .order_by("-test_count", "lab_test__name")
    )
    rows: list[dict[str, Any]] = []
    for row in grouped:
        count = row["test_count"] or Decimal("0")
        rows.append(
            {
                "lab_test_id": row["lab_test_id"],
                "test_name": row["lab_test__name"] or "",
                "test_code": row["lab_test__code"] or "",
                "department_name": (row["lab_test__department__name"] or "").strip() or "—",
                "test_type": row["lab_test__test_type"] or LabTestType.TYPE_1,
                "test_type_label": _test_type_label(row["lab_test__test_type"]),
                "test_count": _quantity_str(count),
            }
        )
    return rows
