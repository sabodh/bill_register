from __future__ import annotations

from dataclasses import dataclass

from apps.billing.models import Bill, BillLine, BillStatus, BillingItem
from apps.lab.models import LabPackage, LabTest
from apps.lab.services.result_template import build_result_entry_layout


@dataclass
class LabResultWorkItem:
    bill_line_id: int
    lab_test_id: int
    test_name: str
    test_code: str
    method_name: str
    department_name: str
    test_category: str
    test_type: str
    from_package: bool
    package_name: str | None
    result_entry_layout: dict
    default_notes: list[str]

    def to_dict(self) -> dict:
        return {
            "bill_line_id": self.bill_line_id,
            "lab_test_id": self.lab_test_id,
            "test_name": self.test_name,
            "test_code": self.test_code,
            "method_name": self.method_name,
            "department_name": self.department_name,
            "test_category": self.test_category,
            "test_type": self.test_type,
            "from_package": self.from_package,
            "package_name": self.package_name,
            "result_entry_layout": self.result_entry_layout,
            "default_notes": self.default_notes,
        }


def _test_from_billing_item(item: BillingItem | None) -> LabTest | None:
    if item is None or not item.code:
        return None
    if item.code.startswith("LAB-T-"):
        try:
            test_id = int(item.code.removeprefix("LAB-T-"))
        except ValueError:
            return None
        return (
            LabTest.objects.select_related("department")
            .filter(pk=test_id, is_active=True)
            .first()
        )
    return None


def _package_from_billing_item(item: BillingItem | None) -> LabPackage | None:
    if item is None or not item.code:
        return None
    if item.code.startswith("LAB-P-"):
        try:
            package_id = int(item.code.removeprefix("LAB-P-"))
        except ValueError:
            return None
        return (
            LabPackage.objects.filter(pk=package_id, is_active=True)
            .prefetch_related("items__test")
            .first()
        )
    return None


def _default_notes_for_test(test: LabTest) -> list[str]:
    notes: list[str] = []
    for row in test.interpretations.all():
        text = (row.note or "").strip()
        if text:
            notes.append(text)
    return notes


def _work_item_for_test(
    line: BillLine,
    test: LabTest,
    *,
    from_package: bool = False,
    package_name: str | None = None,
) -> LabResultWorkItem:
    dept_name = ""
    if test.department_id and test.department:
        dept_name = test.department.name or ""
    return LabResultWorkItem(
        bill_line_id=line.id,
        lab_test_id=test.id,
        test_name=test.name,
        test_code=test.code or "",
        method_name=test.method_name or "",
        department_name=dept_name,
        test_category=test.test_category,
        test_type=test.test_type or "TYPE_1",
        from_package=from_package,
        package_name=package_name,
        result_entry_layout=build_result_entry_layout(test),
        default_notes=_default_notes_for_test(test),
    )


def _work_item_pair(item: LabResultWorkItem) -> tuple[int, int]:
    return (item.bill_line_id, item.lab_test_id)


def apply_work_item_order(
    items: list[LabResultWorkItem],
    order: list | None,
) -> list[LabResultWorkItem]:
    if not order:
        return items
    key_to_item = {_work_item_pair(item): item for item in items}
    ordered: list[LabResultWorkItem] = []
    seen: set[tuple[int, int]] = set()
    for entry in order:
        if not isinstance(entry, dict):
            continue
        bill_line_id = entry.get("bill_line_id")
        lab_test_id = entry.get("lab_test_id")
        if bill_line_id is None or lab_test_id is None:
            continue
        key = (int(bill_line_id), int(lab_test_id))
        item = key_to_item.get(key)
        if item is not None and key not in seen:
            ordered.append(item)
            seen.add(key)
    for item in items:
        key = _work_item_pair(item)
        if key not in seen:
            ordered.append(item)
    return ordered


def _catalog_sort_key_for_work_item(
    item: LabResultWorkItem,
    tests_by_id: dict[int, LabTest],
) -> tuple[int, int, str]:
    test = tests_by_id.get(item.lab_test_id)
    dept_order = 1_000_000
    test_order = 1_000_000
    if test is not None:
        test_order = test.sort_order
        if test.department_id and test.department:
            dept_order = test.department.sort_order
    return (dept_order, test_order, item.test_name.lower())


def sort_work_items_by_catalog(items: list[LabResultWorkItem]) -> list[LabResultWorkItem]:
    if not items:
        return items
    test_ids = {item.lab_test_id for item in items}
    tests = LabTest.objects.filter(id__in=test_ids).select_related("department")
    tests_by_id = {test.id: test for test in tests}
    return sorted(items, key=lambda item: _catalog_sort_key_for_work_item(item, tests_by_id))


def normalize_work_item_order(
    items: list[LabResultWorkItem],
    order: list | None,
) -> list[dict]:
    applied = apply_work_item_order(items, order)
    return [
        {"bill_line_id": item.bill_line_id, "lab_test_id": item.lab_test_id}
        for item in applied
    ]


def build_lab_result_work_items_unordered(bill: Bill) -> list[LabResultWorkItem]:
    lines = (
        bill.lines.select_related("lab_test", "lab_test__department", "lab_package", "billing_item")
        .prefetch_related(
            "lab_package__items__test",
            "lab_package__items__test__department",
            "lab_package__items__test__interpretations",
            "lab_test__interpretations",
        )
        .order_by("sort_order", "id")
    )
    items: list[LabResultWorkItem] = []
    seen_test_ids: set[int] = set()

    for line in lines:
        if line.lab_test_id:
            test = line.lab_test
            if test and test.id not in seen_test_ids:
                seen_test_ids.add(test.id)
                items.append(_work_item_for_test(line, test))
            continue

        if line.lab_package_id and line.lab_package:
            pkg = line.lab_package
            for pkg_item in pkg.items.all():
                test = pkg_item.test
                if test and test.is_active and test.id not in seen_test_ids:
                    seen_test_ids.add(test.id)
                    items.append(
                        _work_item_for_test(
                            line,
                            test,
                            from_package=True,
                            package_name=pkg.name,
                        )
                    )
            continue

        test = _test_from_billing_item(line.billing_item)
        if test and test.id not in seen_test_ids:
            seen_test_ids.add(test.id)
            items.append(_work_item_for_test(line, test))
            continue

        pkg = _package_from_billing_item(line.billing_item)
        if pkg:
            for pkg_item in pkg.items.all():
                test = pkg_item.test
                if test and test.is_active and test.id not in seen_test_ids:
                    seen_test_ids.add(test.id)
                    items.append(
                        _work_item_for_test(
                            line,
                            test,
                            from_package=True,
                            package_name=pkg.name,
                        )
                    )

    return items


def build_lab_result_work_items(bill: Bill) -> list[LabResultWorkItem]:
    items = build_lab_result_work_items_unordered(bill)
    items = sort_work_items_by_catalog(items)
    return apply_work_item_order(items, bill.lab_result_work_order)


def lab_result_bills_base_queryset():
    return (
        Bill.objects.filter(status=BillStatus.FINAL, patient__isnull=False)
        .select_related("patient", "doctor", "hospital", "branch")
        .prefetch_related("lines")
        .order_by("-sample_collected_at", "-created_at")
    )
