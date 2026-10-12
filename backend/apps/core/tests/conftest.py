import pytest
from django.contrib.auth.models import Group, Permission
from rest_framework.test import APIClient

from apps.core.models import Branch, User
from apps.core.permissions import DEFAULT_ROLE_PERMISSIONS


@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture
def branch(db) -> Branch:
    return Branch.objects.create(name="Main Hospital", code="MAIN", phone="9999999999")


def _ensure_permissions():
    """Assign default role permissions (normally from data migration)."""
    from django.contrib.contenttypes.models import ContentType

    module_perms = [
        ("lab", "test", "view_test", "Can view lab tests"),
        ("lab", "order", "add_order", "Can add lab orders"),
        ("billing", "bill", "view_bill", "Can view bills"),
        ("billing", "bill", "add_bill", "Can add bills"),
        ("pharmacy", "prescription", "view_prescription", "Can view prescriptions"),
        ("pharmacy", "prescription", "dispense", "Can dispense prescriptions"),
        ("clinical", "facesheet", "view_facesheet", "Can view face sheet"),
        ("clinical", "op", "view_op", "Can view OP"),
        ("reports", "report", "view_report", "Can view reports"),
        ("dashboard", "dashboard", "view_dashboard", "Can view dashboard"),
    ]
    for app_label, model, codename, name in module_perms:
        ct, _ = ContentType.objects.get_or_create(app_label=app_label, model=model)
        Permission.objects.get_or_create(codename=codename, name=name, content_type=ct)

    for role_name, perm_strings in DEFAULT_ROLE_PERMISSIONS.items():
        group, _ = Group.objects.get_or_create(name=role_name)
        perms = []
        for codename in perm_strings:
            app_label, code = codename.split(".", 1)
            perms.extend(Permission.objects.filter(content_type__app_label=app_label, codename=code))
        group.permissions.set(perms)


@pytest.fixture
def roles(db):
    _ensure_permissions()


@pytest.fixture
def admin_user(db, branch, roles) -> User:
    user = User.objects.create_user(
        username="admin",
        password="adminpass123",
        branch=branch,
        is_staff=True,
    )
    user.groups.add(Group.objects.get(name="Admin"))
    return user


@pytest.fixture
def auth_client(api_client, admin_user) -> APIClient:
    api_client.force_authenticate(user=admin_user)
    return api_client
