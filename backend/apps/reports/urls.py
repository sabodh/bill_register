from django.urls import path

from apps.reports.views import (
    LabBillReportByDoctorView,
    LabBillReportByHospitalView,
    LabBillReportListView,
)

urlpatterns = [
    path("lab-bills/", LabBillReportListView.as_view(), name="reports-lab-bills"),
    path("lab-bills/by-doctor/", LabBillReportByDoctorView.as_view(), name="reports-lab-bills-by-doctor"),
    path(
        "lab-bills/by-hospital/",
        LabBillReportByHospitalView.as_view(),
        name="reports-lab-bills-by-hospital",
    ),
]
