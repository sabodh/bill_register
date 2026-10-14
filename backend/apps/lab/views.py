from rest_framework import status
from rest_framework.response import Response

from apps.core import permissions as perms
from apps.core.permissions_classes import HasAnyPerm, HasPerm
from apps.core.views.base import CoreModelViewSet
from apps.lab.filters import LabPackageFilter, LabTestFilter, TestDepartmentFilter
from apps.lab.models import LabPackage, LabTest, TestDepartment
from apps.lab.serializers import (
    LabPackageSerializer,
    LabPackageWriteSerializer,
    LabTestSerializer,
    TestDepartmentSerializer,
)


class TestDepartmentViewSet(CoreModelViewSet):
    serializer_class = TestDepartmentSerializer
    filterset_class = TestDepartmentFilter
    search_fields = ["name", "code"]
    ordering_fields = ["name", "created_at"]
    permission_classes = [HasPerm(perms.LAB_VIEW_TEST)]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [HasAnyPerm(perms.LAB_ADD_ORDER, perms.LAB_VIEW_TEST)()]
        return super().get_permissions()

    def get_queryset(self):
        qs = TestDepartment.objects.select_related("branch", "created_by", "updated_by").filter(
            is_active=True
        )
        return self.get_branch_filtered_queryset(qs)


class LabPackageViewSet(CoreModelViewSet):
    filterset_class = LabPackageFilter
    search_fields = ["name"]
    ordering_fields = ["name", "created_at", "package_amount"]
    permission_classes = [HasPerm(perms.LAB_VIEW_TEST)]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return LabPackageWriteSerializer
        return LabPackageSerializer

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [HasAnyPerm(perms.LAB_ADD_ORDER, perms.LAB_VIEW_TEST)()]
        return super().get_permissions()

    def get_queryset(self):
        qs = (
            LabPackage.objects.select_related("branch", "created_by", "updated_by")
            .prefetch_related("items", "items__test")
            .filter(is_active=True)
        )
        return self.get_branch_filtered_queryset(qs)

    def _package_response(
        self, package: LabPackage, *, status_code: int = status.HTTP_200_OK
    ) -> Response:
        package = (
            LabPackage.objects.select_related("branch", "created_by", "updated_by")
            .prefetch_related("items", "items__test")
            .get(pk=package.pk)
        )
        data = LabPackageSerializer(package, context=self.get_serializer_context()).data
        return Response(data, status=status_code)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return self._package_response(serializer.instance, status_code=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return self._package_response(serializer.instance)

    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)


class LabTestViewSet(CoreModelViewSet):
    serializer_class = LabTestSerializer
    filterset_class = LabTestFilter
    search_fields = ["name", "code"]
    ordering_fields = ["name", "created_at", "code"]
    permission_classes = [HasPerm(perms.LAB_VIEW_TEST)]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [HasAnyPerm(perms.LAB_ADD_ORDER, perms.LAB_VIEW_TEST)()]
        return super().get_permissions()

    def get_queryset(self):
        qs = (
            LabTest.objects.select_related("branch", "department", "created_by", "updated_by")
            .prefetch_related("reference_ranges", "interpretations")
            .filter(is_active=True)
        )
        return self.get_branch_filtered_queryset(qs)
