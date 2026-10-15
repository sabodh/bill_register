from __future__ import annotations

from django.db import transaction

from apps.billing.models import Bill, BillLine, BillStatus
from apps.lab.models import LabBillLineResult

# Per-bill result note for a work item (not counted toward result completion).
WORK_ITEM_RESULT_NOTE_KEY = "note"


def storage_result_key(lab_test_id: int, result_key: str) -> str:
    return f"t{lab_test_id}:{result_key}"


def parse_storage_result_key(storage_key: str) -> tuple[int | None, str]:
    if storage_key.startswith("t") and ":" in storage_key:
        prefix, rest = storage_key.split(":", 1)
        try:
            return int(prefix[1:]), rest
        except ValueError:
            pass
    return None, storage_key


def saved_results_for_bill(bill: Bill) -> list[dict]:
    rows = (
        LabBillLineResult.objects.filter(bill_line__bill=bill)
        .select_related("bill_line")
        .order_by("bill_line_id", "result_key")
    )
    out: list[dict] = []
    for row in rows:
        lab_test_id, result_key = parse_storage_result_key(row.result_key)
        if lab_test_id is None and row.bill_line.lab_test_id:
            lab_test_id = row.bill_line.lab_test_id
        out.append(
            {
                "bill_line_id": row.bill_line_id,
                "lab_test_id": lab_test_id,
                "result_key": result_key,
                "value": row.value,
            }
        )
    return out


@transaction.atomic
def upsert_lab_bill_line_results(
    bill: Bill,
    entries: list[dict],
    *,
    user_branch_id: int | None,
) -> None:
    if bill.status == BillStatus.CANCELLED:
        raise ValueError("Cancelled bills cannot be edited.")
    if user_branch_id is not None and bill.branch_id != user_branch_id:
        raise ValueError("You cannot edit bills from another branch.")

    line_ids = set(
        BillLine.objects.filter(bill=bill).values_list("id", flat=True),
    )
    for entry in entries:
        line_id = entry["bill_line_id"]
        if line_id not in line_ids:
            raise ValueError(f"Bill line {line_id} does not belong to this bill.")
        result_key = (entry.get("result_key") or "").strip()
        if not result_key:
            raise ValueError("Each result entry requires a result_key.")
        lab_test_id = entry.get("lab_test_id")
        if lab_test_id is None:
            raise ValueError("Each result entry requires a lab_test_id.")
        value = entry.get("value") or ""
        stored_key = storage_result_key(int(lab_test_id), result_key)
        LabBillLineResult.objects.update_or_create(
            bill_line_id=line_id,
            result_key=stored_key,
            defaults={"value": value},
        )
