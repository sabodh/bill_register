from apps.billing.models import Bill, BillingItem
from apps.billing.serializers import (
    BillCreateSerializer,
    BillSerializer,
    BillingItemSerializer,
)
from apps.core import permissions as perms
from apps.core.mixins import BranchFilterMixin
from apps.core.permissions_classes import HasPerm
from rest_framework import mixins, viewsets


class BillingItemViewSet(BranchFilterMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = BillingItemSerializer
    search_fields = ["name", "code"]
    ordering_fields = ["name", "code"]
    permission_classes = [HasPerm(perms.BILLING_VIEW_BILL)]

    def get_queryset(self):
        qs = BillingItem.objects.filter(is_active=True).select_related("branch")
        return self.get_branch_filtered_queryset(qs)


class BillViewSet(BranchFilterMixin, mixins.CreateModelMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    permission_classes = [HasPerm(perms.BILLING_VIEW_BILL)]

    def get_permissions(self):
        if self.action == "create":
            return [HasPerm(perms.BILLING_ADD_BILL)()]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.action == "create":
            return BillCreateSerializer
        return BillSerializer

    def get_queryset(self):
        qs = Bill.objects.prefetch_related("lines", "lines__billing_item").select_related(
            "patient", "branch"
        )
        return self.get_branch_filtered_queryset(qs)
