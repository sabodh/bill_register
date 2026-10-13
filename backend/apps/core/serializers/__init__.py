from apps.core.serializers.auth import MeSerializer
from apps.core.serializers.branch import BranchSerializer
from apps.core.serializers.doctor import DoctorSerializer
from apps.core.serializers.doctor_department import DoctorDepartmentSerializer
from apps.core.serializers.patient import PatientSerializer
from apps.core.serializers.role import RoleSerializer
from apps.core.serializers.staff import StaffSerializer
from apps.core.serializers.staff_department import StaffDepartmentSerializer
from apps.core.serializers.user import UserSerializer

__all__ = [
    "BranchSerializer",
    "DoctorDepartmentSerializer",
    "DoctorSerializer",
    "MeSerializer",
    "PatientSerializer",
    "RoleSerializer",
    "StaffDepartmentSerializer",
    "StaffSerializer",
    "UserSerializer",
]
