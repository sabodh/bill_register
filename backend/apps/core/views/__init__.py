from apps.core.views.auth import MeView, TokenLoginView, TokenRefreshView
from apps.core.views.branch import BranchViewSet
from apps.core.views.doctor import DoctorViewSet
from apps.core.views.doctor_department import DoctorDepartmentViewSet
from apps.core.views.patient import PatientViewSet
from apps.core.views.role import RoleViewSet
from apps.core.views.staff import StaffViewSet
from apps.core.views.staff_department import StaffDepartmentViewSet
from apps.core.views.user import UserViewSet

__all__ = [
    "BranchViewSet",
    "DoctorDepartmentViewSet",
    "DoctorViewSet",
    "MeView",
    "PatientViewSet",
    "RoleViewSet",
    "StaffDepartmentViewSet",
    "StaffViewSet",
    "TokenLoginView",
    "TokenRefreshView",
    "UserViewSet",
]
