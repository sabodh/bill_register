from __future__ import annotations

from apps.billing.models import Bill
from apps.lab.services.result_values import saved_results_for_bill
from apps.lab.services.result_worklist import build_lab_result_work_items


def iter_required_result_slots(bill: Bill) -> list[tuple[int, int, str]]:
    """(bill_line_id, lab_test_id, result_key) for each result entry field on the bill."""
    slots: list[tuple[int, int, str]] = []
    for item in build_lab_result_work_items(bill):
        layout = item.result_entry_layout
        kind = layout.get("layout")
        if kind == "billing_only":
            continue
        if kind in ("single", "multi_reference"):
            slots.append((item.bill_line_id, item.lab_test_id, layout["result_key"]))
        elif kind == "panel":
            for row in layout.get("rows", []):
                slots.append((item.bill_line_id, item.lab_test_id, row["result_key"]))
    return slots


def bill_results_completed(bill: Bill) -> bool:
    slots = iter_required_result_slots(bill)
    if not slots:
        return True
    saved = {
        (r["bill_line_id"], r["lab_test_id"], r["result_key"]): (r.get("value") or "").strip()
        for r in saved_results_for_bill(bill)
    }
    return all(saved.get(slot, "") for slot in slots)


def bill_result_completion_summary(bill: Bill) -> dict:
    slots = iter_required_result_slots(bill)
    saved = {
        (r["bill_line_id"], r["lab_test_id"], r["result_key"]): (r.get("value") or "").strip()
        for r in saved_results_for_bill(bill)
    }
    filled = sum(1 for slot in slots if saved.get(slot, ""))
    total = len(slots)
    return {
        "billing_completed": True,
        "results_completed": total == 0 or filled == total,
        "result_slots_filled": filled,
        "result_slots_total": total,
    }
