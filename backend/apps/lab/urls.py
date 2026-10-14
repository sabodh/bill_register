from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.lab.views import LabPackageViewSet, LabTestViewSet, TestDepartmentViewSet

router = DefaultRouter()
router.register("test-departments", TestDepartmentViewSet, basename="test-department")
router.register("tests", LabTestViewSet, basename="lab-test")
router.register("packages", LabPackageViewSet, basename="lab-package")

urlpatterns = [
    path("", include(router.urls)),
]
