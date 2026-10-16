from __future__ import annotations

from django.db import transaction

from apps.lab.models import LabTest, TestDepartment


@transaction.atomic
def save_catalog_report_order(
    *,
    branch_id: int,
    department_ids: list[int],
    test_ids: list[int],
) -> None:
    for index, dept_id in enumerate(department_ids):
        TestDepartment.objects.filter(pk=dept_id, branch_id=branch_id, is_active=True).update(
            sort_order=index,
        )
    for index, test_id in enumerate(test_ids):
        LabTest.objects.filter(pk=test_id, branch_id=branch_id, is_active=True).update(
            sort_order=index,
        )
