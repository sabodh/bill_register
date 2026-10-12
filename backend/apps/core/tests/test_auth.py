import pytest
from django.contrib.auth.models import Group

from apps.core.models import User


@pytest.mark.django_db
def test_login_returns_tokens(api_client, branch, roles):
    user = User.objects.create_user(username="recep", password="secret123", branch=branch)
    user.groups.add(Group.objects.get(name="Receptionist"))

    response = api_client.post("/api/auth/login/", {"username": "recep", "password": "secret123"})
    assert response.status_code == 200
    assert "access" in response.data
    assert "refresh" in response.data


@pytest.mark.django_db
def test_me_returns_permissions(auth_client, admin_user):
    response = auth_client.get("/api/auth/me/")
    assert response.status_code == 200
    assert response.data["username"] == "admin"
    assert "core.view_patient" in response.data["permissions"]
    assert response.data["branch"] == admin_user.branch_id
