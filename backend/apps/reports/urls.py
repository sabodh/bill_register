from django.urls import path

from apps.reports.views import (
    LabBillReportByDoctorView,
    LabBillReportByHospitalView,
    LabBillReportListView,
    LabTestCountReportView,
)

urlpatterns = [
    path("lab-bills/", LabBillReportListView.as_view(), name="reports-lab-bills"),
    path("lab-bills/by-doctor/", LabBillReportByDoctorView.as_view(), name="reports-lab-bills-by-doctor"),
    path(
        "lab-bills/by-hospital/",
        LabBillReportByHospitalView.as_view(),
        name="reports-lab-bills-by-hospital",
    ),
    path("lab-tests/count/", LabTestCountReportView.as_view(), name="reports-lab-test-count"),
]
