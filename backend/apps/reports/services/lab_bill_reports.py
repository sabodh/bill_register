from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any

from django.db.models import Count, Sum
from django.db.models.functions import Coalesce
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime

from apps.billing.models import Bill, BillStatus
from apps.billing.services.balance import balance_due_for_bill
from apps.lab.services.result_worklist import lab_result_bills_base_queryset


def _parse_range(date_from: str | None, date_to: str | None) -> tuple[datetime | None, datetime | None]:
    start = None
    end = None
    if date_from:
        parsed = parse_datetime(date_from)
        if parsed is None:
            day = parse_date(date_from)
            if day:
                parsed = timezone.make_aware(datetime.combine(day, datetime.min.time()))
        start = parsed
    if date_to:
        parsed = parse_datetime(date_to)
        if parsed is None:
            day = parse_date(date_to)
            if day:
                parsed = timezone.make_aware(datetime.combine(day, datetime.max.time()))
        end = parsed
    return start, end


def lab_bill_report_queryset(branch_filtered_qs):
    return (
        branch_filtered_qs.filter(status=BillStatus.FINAL)
        .select_related("patient", "doctor", "hospital")
        .order_by("-sample_collected_at", "-created_at")
    )


def apply_lab_bill_date_filter(qs, date_from: str | None, date_to: str | None):
    start, end = _parse_range(date_from, date_to)
    if start:
        qs = qs.filter(sample_collected_at__gte=start)
    if end:
        qs = qs.filter(sample_collected_at__lte=end)
    return qs


def _money(value: Decimal | None) -> str:
    if value is None:
        return "0.00"
    return f"{value:.2f}"


def summary_from_bills(qs) -> dict[str, Any]:
    agg = qs.aggregate(
        bill_count=Count("id"),
        total_amount=Coalesce(Sum("total_amount"), Decimal("0")),
        advance_paid=Coalesce(Sum("advance_paid"), Decimal("0")),
    )
    total = agg["total_amount"] or Decimal("0")
    advance = agg["advance_paid"] or Decimal("0")
    balance = total - advance
    if balance < 0:
        balance = Decimal("0")
    return {
        "bill_count": agg["bill_count"] or 0,
        "total_amount": _money(total),
        "advance_paid": _money(advance),
        "balance_due": _money(balance),
    }


def serialize_bill_row(bill: Bill) -> dict[str, Any]:
    return {
        "id": bill.id,
        "bill_number": bill.bill_number,
        "patient_name": bill.patient.name if bill.patient_id else "",
        "patient_uhid": bill.patient.uhid if bill.patient_id else "",
        "doctor_id": bill.doctor_id,
        "doctor_name": (bill.doctor_name or "").strip() or "—",
        "hospital_id": bill.hospital_id,
        "hospital_name": (bill.hospital_name or "").strip() or "—",
        "sample_collected_at": bill.sample_collected_at.isoformat() if bill.sample_collected_at else None,
        "total_amount": _money(bill.total_amount),
        "advance_paid": _money(bill.advance_paid),
        "balance_due": _money(balance_due_for_bill(bill)),
    }


def lab_bill_list_report(qs) -> list[dict[str, Any]]:
    return [serialize_bill_row(bill) for bill in qs]


def lab_bill_by_doctor_report(qs) -> list[dict[str, Any]]:
    grouped = (
        qs.values("doctor_id", "doctor_name")
        .annotate(
            bill_count=Count("id"),
            total_amount=Coalesce(Sum("total_amount"), Decimal("0")),
            advance_paid=Coalesce(Sum("advance_paid"), Decimal("0")),
        )
        .order_by("-total_amount")
    )
    rows = []
    for row in grouped:
        total = row["total_amount"] or Decimal("0")
        advance = row["advance_paid"] or Decimal("0")
        balance = max(Decimal("0"), total - advance)
        name = (row["doctor_name"] or "").strip()
        if not name:
            name = "No doctor" if row["doctor_id"] is None else "—"
        rows.append(
            {
                "doctor_id": row["doctor_id"],
                "doctor_name": name,
                "bill_count": row["bill_count"],
                "total_amount": _money(total),
                "advance_paid": _money(advance),
                "balance_due": _money(balance),
            }
        )
    return rows


def lab_bill_by_hospital_report(qs) -> list[dict[str, Any]]:
    grouped = (
        qs.values("hospital_id", "hospital_name")
        .annotate(
            bill_count=Count("id"),
            total_amount=Coalesce(Sum("total_amount"), Decimal("0")),
            advance_paid=Coalesce(Sum("advance_paid"), Decimal("0")),
        )
        .order_by("-total_amount")
    )
    rows = []
    for row in grouped:
        total = row["total_amount"] or Decimal("0")
        advance = row["advance_paid"] or Decimal("0")
        balance = max(Decimal("0"), total - advance)
        name = (row["hospital_name"] or "").strip()
        if not name:
            name = "No hospital" if row["hospital_id"] is None else "—"
        rows.append(
            {
                "hospital_id": row["hospital_id"],
                "hospital_name": name,
                "bill_count": row["bill_count"],
                "total_amount": _money(total),
                "advance_paid": _money(advance),
                "balance_due": _money(balance),
            }
        )
    return rows


def build_lab_bill_report(branch_filtered_qs, date_from: str | None, date_to: str | None) -> Any:
    lab_ids = lab_result_bills_base_queryset().values("pk")
    qs = lab_bill_report_queryset(branch_filtered_qs.filter(pk__in=lab_ids))
    return apply_lab_bill_date_filter(qs, date_from, date_to)
