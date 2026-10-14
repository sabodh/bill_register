from django.db.models import Q

from apps.billing.models import Bill, BillStatus, BillingItem
from apps.billing.services.lab_catalog import sync_all_lab_catalog_for_branch
from apps.billing.serializers import (
    BillCreateSerializer,
    BillSerializer,
    BillLabSessionSerializer,
    BillUpdateSerializer,
    BillingItemSerializer,
)
from apps.billing.services.complete_payment import complete_bill_payment
from apps.core import permissions as perms
from apps.core.mixins import BranchFilterMixin
from apps.core.permissions_classes import HasPerm
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response


class BillingItemViewSet(BranchFilterMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = BillingItemSerializer
    search_fields = ["name", "code"]
    ordering_fields = ["name", "code"]
    permission_classes = [HasPerm(perms.BILLING_VIEW_BILL)]

    def get_queryset(self):
        qs = BillingItem.objects.filter(is_active=True).select_related("branch")
        qs = self.get_branch_filtered_queryset(qs)
        catalog = self.request.query_params.get("catalog")
        if catalog == "lab":
            qs = qs.filter(Q(code__startswith="LAB-T-") | Q(code__startswith="LAB-P-"))
            if not qs.exists() and self.request.user.branch_id:
                sync_all_lab_catalog_for_branch(self.request.user.branch_id)
                qs = BillingItem.objects.filter(is_active=True).filter(
                    Q(code__startswith="LAB-T-") | Q(code__startswith="LAB-P-"),
                    branch_id=self.request.user.branch_id,
                )
        return qs


class BillViewSet(
    BranchFilterMixin,
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [HasPerm(perms.BILLING_VIEW_BILL)]

    def get_permissions(self):
        if self.action in (
            "create",
            "update",
            "partial_update",
            "cancel",
            "complete_payment",
            "lab_session",
        ):
            return [HasPerm(perms.BILLING_ADD_BILL)()]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.action == "create":
            return BillCreateSerializer
        if self.action in ("update", "partial_update"):
            return BillUpdateSerializer
        return BillSerializer

    def get_queryset(self):
        qs = Bill.objects.prefetch_related(
            "lines",
            "lines__billing_item",
            "lines__lab_test",
            "lines__lab_package",
        ).select_related("patient", "patient__doctor", "branch", "doctor", "hospital")
        return self.get_branch_filtered_queryset(qs)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        bill = serializer.save()
        output = BillSerializer(bill, context=self.get_serializer_context())
        headers = self.get_success_headers(output.data)
        return Response(output.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        bill = serializer.save()
        output = BillSerializer(bill, context=self.get_serializer_context())
        return Response(output.data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        bill = self.get_object()
        if bill.status == BillStatus.CANCELLED:
            return Response(
                {"detail": "Bill is already cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        bill.status = BillStatus.CANCELLED
        bill.updated_by = request.user
        bill.save(update_fields=["status", "updated_by"])
        output = BillSerializer(bill, context=self.get_serializer_context())
        return Response(output.data)

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

    @action(detail=True, methods=["patch"])
    def lab_session(self, request, pk=None):
        bill = self.get_object()
        serializer = BillLabSessionSerializer(
            bill, data=request.data, partial=True, context=self.get_serializer_context()
        )
        serializer.is_valid(raise_exception=True)
        bill = serializer.save()
        output = BillSerializer(bill, context=self.get_serializer_context())
        return Response(output.data)
