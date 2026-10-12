import importlib

import pytest
from django.urls import get_resolver
from rest_framework.views import APIView


def _iter_callbacks(patterns):
    for pattern in patterns:
        if hasattr(pattern, "url_patterns"):
            yield from _iter_callbacks(pattern.url_patterns)
        elif hasattr(pattern, "callback"):
            yield pattern.callback


def _iter_api_views():
    resolver = get_resolver()
    for pattern in resolver.url_patterns:
        if not getattr(pattern, "pattern", None):
            continue
        route = str(pattern.pattern)
        if not route.startswith("api/"):
            continue
        if hasattr(pattern, "url_patterns"):
            yield from _iter_callbacks(pattern.url_patterns)
        elif hasattr(pattern, "callback"):
            yield pattern.callback


def _get_view_class(callback):
    cls = getattr(callback, "cls", None)
    if cls:
        return cls
    view_class = getattr(callback, "view_class", None)
    return view_class


def _has_explicit_permissions(view_class) -> bool:
    permission_classes = getattr(view_class, "permission_classes", None)
    if not permission_classes:
        return False
    if callable(permission_classes):
        return True
    return len(permission_classes) > 0


@pytest.mark.django_db
def test_all_api_views_declare_permissions():
    """Every API view must declare permission_classes (login/refresh may use AllowAny)."""
    from apps.core import urls as core_urls

    importlib.reload(core_urls)
    failures: list[str] = []

    for callback in _iter_api_views():
        view_class = _get_view_class(callback)
        if not view_class:
            continue
        if not issubclass(view_class, APIView):
            continue
        path = getattr(callback, "__name__", str(callback))
        if not _has_explicit_permissions(view_class):
            failures.append(f"{view_class.__name__} ({path})")

        # Ensure get_permissions exists for viewsets OR permission_classes is non-empty
        perms = getattr(view_class, "permission_classes", [])
        if perms == []:
            failures.append(f"{view_class.__name__} has empty permission_classes")

    assert not failures, "Views missing permissions: " + ", ".join(failures)


@pytest.mark.django_db
def test_patient_list_requires_permission(api_client, branch, roles):

    from apps.core.models import User

    user = User.objects.create_user(username="noperm", password="x", branch=branch)
    api_client.force_authenticate(user=user)
    response = api_client.get("/api/patients/")
    assert response.status_code == 403
