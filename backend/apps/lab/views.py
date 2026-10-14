from django.db.models import Q
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from apps.billing.services.lab_catalog import sync_lab_package_billing_item, sync_lab_test_billing_item
from apps.core import permissions as perms
from apps.core.permissions_classes import HasAnyPerm, HasPerm
from apps.core.mixins import BranchFilterMixin
from apps.core.views.base import CoreModelViewSet
from apps.billing.serializers import BillSerializer
from apps.billing.services.complete_payment import complete_bill_payment
from apps.lab.result_serializers import (
    LabResultBillDetailSerializer,
    LabResultBillListSerializer,
    LabResultSaveSerializer,
)
from apps.lab.services.result_completion import bill_results_completed
from apps.lab.services.result_worklist import lab_result_bills_base_queryset
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

    def perform_destroy(self, instance):
        super().perform_destroy(instance)
        instance.refresh_from_db(fields=["is_active"])
        sync_lab_package_billing_item(instance)
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

    def perform_destroy(self, instance):
        super().perform_destroy(instance)
        instance.refresh_from_db(fields=["is_active"])
        sync_lab_test_billing_item(instance)
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


class LabResultBillViewSet(BranchFilterMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Final lab bills from billing — worklist for result entry."""

    permission_classes = [HasPerm(perms.LAB_VIEW_TEST)]
    lookup_value_regex = r"[0-9]+"

    def get_permissions(self):
        if self.action in ("save_results", "complete_payment"):
            return [HasAnyPerm(perms.LAB_ADD_ORDER, perms.BILLING_ADD_BILL)()]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.action == "retrieve":
            return LabResultBillDetailSerializer
        return LabResultBillListSerializer

    def list(self, request, *args, **kwargs):
        results_status = (request.query_params.get("results_status") or "").strip().lower()
        queryset = self.filter_queryset(self.get_queryset())
        if results_status in ("pending", "completed"):
            queryset = queryset.prefetch_related(
                "lines__lab_result_values",
                "lines__lab_test",
                "lines__lab_package__items__test",
                "lines__billing_item",
            )
            matching_ids = []
            for bill in queryset:
                complete = bill_results_completed(bill)
                if results_status == "completed" and complete:
                    matching_ids.append(bill.id)
                elif results_status == "pending" and not complete:
                    matching_ids.append(bill.id)
            queryset = queryset.filter(id__in=matching_ids)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def get_queryset(self):
        qs = lab_result_bills_base_queryset()
        qs = self.get_branch_filtered_queryset(qs)
        qs = qs.filter(
            Q(lines__lab_test__isnull=False)
            | Q(lines__lab_package__isnull=False)
            | Q(lines__billing_item__code__startswith="LAB-T-")
            | Q(lines__billing_item__code__startswith="LAB-P-")
        ).distinct()
        patient_id = self.request.query_params.get("patient")
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        search = (self.request.query_params.get("search") or "").strip()
        if search:
            qs = qs.filter(
                Q(bill_number__icontains=search)
                | Q(patient__name__icontains=search)
                | Q(patient__uhid__icontains=search)
            )
        return qs

    @action(detail=True, methods=["post"], url_path="complete-payment")
    def complete_payment(self, request, pk=None):
        bill = self.get_object()
        try:
            bill = complete_bill_payment(bill, request.user)
        except ValidationError as exc:
            detail = exc.detail
            if not isinstance(detail, (dict, list)):
                detail = {"detail": detail}
            return Response(detail, status=status.HTTP_400_BAD_REQUEST)
        output = BillSerializer(bill, context=self.get_serializer_context())
        return Response(output.data)

    @action(detail=True, methods=["post"], url_path="save-results")
    def save_results(self, request, pk=None):
        bill = self.get_object()
        serializer = LabResultSaveSerializer(data=request.data, context=self.get_serializer_context())
        serializer.is_valid(raise_exception=True)
        bill = serializer.save(bill)
        output = LabResultBillDetailSerializer(bill, context=self.get_serializer_context())
        return Response(output.data)
