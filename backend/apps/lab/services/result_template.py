"""Build a portable layout spec for result entry screens and PDF reports."""

from __future__ import annotations

from decimal import Decimal
from typing import Any

from apps.lab.models import LabTest, TestType


def _decimal_str(value: Decimal | None) -> str | None:
    if value is None:
        return None
    return format(value, "f").rstrip("0").rstrip(".") or "0"


def _variant_display_text(
    label: str,
    low: Decimal | None,
    high: Decimal | None,
    unit: str,
) -> str:
    """e.g. male - 120 mg/dL (PDF / result line)."""
    low_s = _decimal_str(low)
    high_s = _decimal_str(high)
    unit_s = (unit or "").strip()
    if low is not None and high is not None and low == high and low_s:
        value_part = f"{low_s} {unit_s}".strip()
    else:
        ref = _format_ref_range(low, high)
        value_part = f"{ref} {unit_s}".strip() if ref else unit_s
    if label:
        return f"{label} - {value_part}".strip()
    return value_part


def _format_ref_range(low: Decimal | None, high: Decimal | None) -> str | None:
    low_s = _decimal_str(low)
    high_s = _decimal_str(high)
    if low_s and high_s:
        return f"{low_s} – {high_s}"
    if low_s:
        return f"≥ {low_s}"
    if high_s:
        return f"≤ {high_s}"
    return None


def build_result_entry_layout(test: LabTest) -> dict[str, Any]:
    """
    layout kinds:
    - single: one analyte (NORMAL)
    - panel: parent title + subtest rows (SUBTEST)
    - multi_reference: one result, several labelled references (MULTIPLE_REFERENCE)
    - billing_only: no result entry (SPECIAL — e.g. X-ray)
    """
    ranges = list(test.reference_ranges.all())
    base = {
        "test_id": test.id,
        "test_type": test.test_type,
        "title": test.name,
        "method_name": test.method_name or "",
    }

    if test.test_type == TestType.SPECIAL:
        return {**base, "layout": "billing_only"}

    if test.test_type == TestType.SUBTEST:
        return {
            **base,
            "layout": "panel",
            "panel_title": test.name,
            "columns": [
                {"key": "subtest_name", "label": "Subtest names"},
                {"key": "result", "label": "Result", "editable": True},
                {"key": "reference", "label": "Biological reference range (min–max)"},
                {"key": "unit", "label": "Unit"},
            ],
            "rows": [
                {
                    "result_key": f"param-{row.id}",
                    "subtest_name": row.reference_text or f"Line {row.sort_order + 1}",
                    "reference": _format_ref_range(row.low_value, row.high_value),
                    "reference_low": _decimal_str(row.low_value),
                    "reference_high": _decimal_str(row.high_value),
                    "unit": row.unit or "",
                }
                for row in ranges
            ],
        }

    if test.test_type == TestType.MULTIPLE_REFERENCE:
        unit = ranges[0].unit if ranges else ""
        return {
            **base,
            "layout": "multi_reference",
            "result_key": "main",
            "unit": unit,
            "variants": [
                {
                    "label": row.reference_text or f"Range {row.sort_order + 1}",
                    "reference": _format_ref_range(row.low_value, row.high_value),
                    "reference_low": _decimal_str(row.low_value),
                    "reference_high": _decimal_str(row.high_value),
                    "unit": row.unit or unit,
                    "display_text": _variant_display_text(
                        row.reference_text or f"Range {row.sort_order + 1}",
                        row.low_value,
                        row.high_value,
                        row.unit or unit,
                    ),
                }
                for row in ranges
            ],
        }

    row = ranges[0] if ranges else None
    return {
        **base,
        "layout": "single",
        "result_key": "main",
        "unit": row.unit if row else "",
        "reference": _format_ref_range(row.low_value, row.high_value) if row else None,
        "reference_low": _decimal_str(row.low_value) if row else None,
        "reference_high": _decimal_str(row.high_value) if row else None,
    }
