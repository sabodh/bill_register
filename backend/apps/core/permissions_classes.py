from rest_framework import permissions


class DjangoModelPermission(permissions.DjangoModelPermissions):
    """Map GET to view_* permission."""

    perms_map = {
        "GET": ["%(app_label)s.view_%(model_name)s"],
        "OPTIONS": [],
        "HEAD": [],
        "POST": ["%(app_label)s.add_%(model_name)s"],
        "PUT": ["%(app_label)s.change_%(model_name)s"],
        "PATCH": ["%(app_label)s.change_%(model_name)s"],
        "DELETE": ["%(app_label)s.delete_%(model_name)s"],
    }


def HasPerm(perm: str) -> type[permissions.BasePermission]:
    class _HasPerm(permissions.BasePermission):
        def has_permission(self, request, view) -> bool:
            return bool(
                request.user and request.user.is_authenticated and request.user.has_perm(perm)
            )

    _HasPerm.__name__ = f"HasPerm_{perm.replace('.', '_')}"
    return _HasPerm


def HasAnyPerm(*perms: str) -> type[permissions.BasePermission]:
    class _HasAnyPerm(permissions.BasePermission):
        def has_permission(self, request, view) -> bool:
            if not request.user or not request.user.is_authenticated:
                return False
            return any(request.user.has_perm(p) for p in perms)

    return _HasAnyPerm
