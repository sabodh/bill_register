from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.billing.views import BillViewSet, BillingItemViewSet

router = DefaultRouter()
router.register("items", BillingItemViewSet, basename="billing-item")
router.register("bills", BillViewSet, basename="bill")

urlpatterns = [
    path("", include(router.urls)),
]
