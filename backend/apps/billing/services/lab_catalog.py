from __future__ import annotations

from apps.billing.models import BillingItem, ItemType
from apps.lab.models import LabPackage, LabTest


def billing_code_for_test(test_id: int) -> str:
    return f"LAB-T-{test_id}"


def billing_code_for_package(package_id: int) -> str:
    return f"LAB-P-{package_id}"


def sync_lab_test_billing_item(test: LabTest) -> BillingItem | None:
    if not test.branch_id:
        return None
    user = test.updated_by or test.created_by
    defaults = {
        "name": test.name,
        "item_type": ItemType.LAB,
        "default_rate": test.default_rate,
        "is_active": test.is_active,
        "updated_by": user,
    }
    item, created = BillingItem.objects.update_or_create(
        branch_id=test.branch_id,
        code=billing_code_for_test(test.id),
        defaults=defaults,
    )
    if created and user:
        item.created_by = user
        item.save(update_fields=["created_by"])
    return item


def sync_lab_package_billing_item(package: LabPackage) -> BillingItem | None:
    if not package.branch_id:
        return None
    user = package.updated_by or package.created_by
    defaults = {
        "name": package.name,
        "item_type": ItemType.LAB,
        "default_rate": package.package_amount,
        "is_active": package.is_active,
        "updated_by": user,
    }
    item, created = BillingItem.objects.update_or_create(
        branch_id=package.branch_id,
        code=billing_code_for_package(package.id),
        defaults=defaults,
    )
    if created and user:
        item.created_by = user
        item.save(update_fields=["created_by"])
    return item


def sync_all_lab_catalog_for_branch(branch_id: int) -> None:
    for test in LabTest.objects.filter(branch_id=branch_id):
        sync_lab_test_billing_item(test)
    for package in LabPackage.objects.filter(branch_id=branch_id):
        sync_lab_package_billing_item(package)
