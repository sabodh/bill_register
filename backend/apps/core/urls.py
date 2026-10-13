from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.core.views import (
    BranchViewSet,
    DoctorDepartmentViewSet,
    DoctorViewSet,
    MeView,
    PatientViewSet,
    RoleViewSet,
    StaffDepartmentViewSet,
    StaffViewSet,
    TokenLoginView,
    TokenRefreshView,
    UserViewSet,
)

router = DefaultRouter()
router.register("branches", BranchViewSet, basename="branch")
router.register("users", UserViewSet, basename="user")
router.register("roles", RoleViewSet, basename="role")
router.register("patients", PatientViewSet, basename="patient")
router.register("doctor-departments", DoctorDepartmentViewSet, basename="doctor-department")
router.register("doctors", DoctorViewSet, basename="doctor")
router.register("staff-departments", StaffDepartmentViewSet, basename="staff-department")
router.register("staff", StaffViewSet, basename="staff")

urlpatterns = [
    path("auth/login/", TokenLoginView.as_view(), name="token_login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("", include(router.urls)),
]
