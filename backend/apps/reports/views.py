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
from apps.reports.services.lab_test_count_reports import (
    lab_test_count_lines_qs,
    lab_test_count_report,
    summary_from_test_count_lines,
)
from rest_framework.response import Response
from rest_framework.views import APIView


class LabBillReportBaseView(BranchFilterMixin, APIView):
    permission_classes = [HasPerm(perms.REPORTS_VIEW)]
    search_profile = "list"

    def get_filtered_bills(self, request, *, apply_bill_search: bool = True):
        qs = Bill.objects.all()
        qs = self.get_branch_filtered_queryset(qs)
        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")
        search = request.query_params.get("search") if apply_bill_search else None
        return build_lab_bill_report(qs, date_from, date_to, search, self.search_profile)


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
    search_profile = "doctor"

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
    search_profile = "hospital"

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


class LabTestCountReportView(LabBillReportBaseView):
    def get(self, request):
        bill_qs = self.get_filtered_bills(request, apply_bill_search=False)
        search = request.query_params.get("search")
        lines_qs = lab_test_count_lines_qs(bill_qs, search)
        return Response(
            {
                "date_from": request.query_params.get("date_from"),
                "date_to": request.query_params.get("date_to"),
                "summary": summary_from_test_count_lines(lines_qs),
                "rows": lab_test_count_report(bill_qs, search),
            }
        )
