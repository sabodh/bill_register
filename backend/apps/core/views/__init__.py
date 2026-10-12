from apps.core.views.auth import MeView, TokenLoginView, TokenRefreshView
from apps.core.views.branch import BranchViewSet
from apps.core.views.doctor import DoctorViewSet
from apps.core.views.patient import PatientViewSet
from apps.core.views.role import RoleViewSet
from apps.core.views.staff import StaffViewSet
from apps.core.views.user import UserViewSet

__all__ = [
    "BranchViewSet",
    "DoctorViewSet",
    "MeView",
    "PatientViewSet",
    "RoleViewSet",
    "StaffViewSet",
    "TokenLoginView",
    "TokenRefreshView",
    "UserViewSet",
]
