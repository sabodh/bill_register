import pytest
from django.contrib.auth.models import Group


@pytest.mark.django_db
def test_create_user_with_role(auth_client, branch):
    role = Group.objects.get(name="Receptionist")
    payload = {
        "username": "newrecep",
        "password": "pass12345",
        "email": "r@example.com",
        "branch": branch.id,
        "role_ids": [role.id],
        "is_active": True,
    }
    response = auth_client.post("/api/users/", payload, format="json")
    assert response.status_code == 201
    assert response.data["username"] == "newrecep"
    assert "Receptionist" in response.data["role_names"]
