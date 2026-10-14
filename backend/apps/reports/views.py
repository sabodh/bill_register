from apps.billing.models import Bill
from apps.core import permissions as perms
from apps.core.mixins import BranchFilterMixin
from apps.core.permissions_classes import HasPerm
from apps.reports.services.lab_bill_reports import (
    build_lab_bill_report,
    lab_bill_by_doctor_report,
    lab_bill_by_hospital_report,
    lab_bill_list_report,
    summary_from_bills,
)
from rest_framework.response import Response
from rest_framework.views import APIView


class LabBillReportBaseView(BranchFilterMixin, APIView):
    permission_classes = [HasPerm(perms.REPORTS_VIEW)]

    def get_filtered_bills(self, request):
        qs = Bill.objects.all()
        qs = self.get_branch_filtered_queryset(qs)
        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")
        return build_lab_bill_report(qs, date_from, date_to)


class LabBillReportListView(LabBillReportBaseView):
    def get(self, request):
        qs = self.get_filtered_bills(request)
        return Response(
            {
                "date_from": request.query_params.get("date_from"),
                "date_to": request.query_params.get("date_to"),
                "summary": summary_from_bills(qs),
                "rows": lab_bill_list_report(qs[:500]),
            }
        )


class LabBillReportByDoctorView(LabBillReportBaseView):
    def get(self, request):
        qs = self.get_filtered_bills(request)
        return Response(
            {
                "date_from": request.query_params.get("date_from"),
                "date_to": request.query_params.get("date_to"),
                "summary": summary_from_bills(qs),
                "rows": lab_bill_by_doctor_report(qs),
            }
        )


class LabBillReportByHospitalView(LabBillReportBaseView):
    def get(self, request):
        qs = self.get_filtered_bills(request)
        return Response(
            {
                "date_from": request.query_params.get("date_from"),
                "date_to": request.query_params.get("date_to"),
                "summary": summary_from_bills(qs),
                "rows": lab_bill_by_hospital_report(qs),
            }
        )
