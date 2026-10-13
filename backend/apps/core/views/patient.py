from decimal import Decimal

from apps.billing.models import BillingItem
from apps.core import permissions as perms
from apps.core.filters import PatientFilter
from apps.core.models import Doctor, Patient, RegistrationKind
from apps.core.services.revisit_period import effective_consultation_fee
from apps.core.permissions_classes import HasPerm
from apps.core.serializers import PatientSerializer
from apps.core.serializers.revisit import PatientRevisitSerializer
from apps.core.services.op_token import create_op_registration
from apps.core.views.base import CoreModelViewSet
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response


class PatientViewSet(CoreModelViewSet):
    serializer_class = PatientSerializer
    filterset_class = PatientFilter
    search_fields = ["name", "phone", "uhid", "file_number"]
    ordering_fields = ["created_at", "name", "uhid"]
    permission_classes = [HasPerm(perms.CORE_VIEW_PATIENT)]

    def get_permissions(self):
        if self.action in ("create", "revisit"):
            return [HasPerm(perms.CORE_ADD_PATIENT)()]
        if self.action in ("update", "partial_update", "destroy"):
            return [HasPerm(perms.CORE_CHANGE_PATIENT)()]
        return super().get_permissions()

    def get_queryset(self):
        qs = Patient.objects.select_related(
            "branch", "created_by", "updated_by", "doctor"
        ).filter(is_active=True)
        return self.get_branch_filtered_queryset(qs)

    @action(detail=False, methods=["get"], url_path="fee-preview")
    def fee_preview(self, request):
        doctor_id = request.query_params.get("doctor")
        patient_id = request.query_params.get("patient")
        if not doctor_id:
            return Response({"detail": "doctor is required"}, status=status.HTTP_400_BAD_REQUEST)
        doctor = Doctor.objects.filter(pk=doctor_id, is_active=True).first()
        if not doctor:
            return Response({"detail": "Doctor not found"}, status=status.HTTP_404_NOT_FOUND)
        patient = None
        if patient_id:
            patient = self.get_queryset().filter(pk=patient_id).first()
            if not patient:
                return Response({"detail": "Patient not found"}, status=status.HTTP_404_NOT_FOUND)
        fee, waived = effective_consultation_fee(patient, doctor)
        return Response(
            {
                "doctor": doctor.id,
                "patient": patient.id if patient else None,
                "consultation_fee": fee,
                "consultation_fee_waived": waived,
                "revisit_period_days": doctor.revisit_period_days,
            }
        )

    @action(detail=False, methods=["get"], url_path="registration-fees")
    def registration_fees(self, request):
        branch_id = request.user.branch_id
        reg_item = None
        if branch_id:
            reg_item = BillingItem.objects.filter(
                branch_id=branch_id, code="OP-REG", is_active=True
            ).first()
        if not reg_item:
            reg_item = BillingItem.objects.filter(code="OP-REG", is_active=True).first()
        fee = reg_item.default_rate if reg_item else Decimal("0")
        return Response(
            {
                "registration_fee": str(fee),
                "registration_item_id": reg_item.id if reg_item else None,
                "consultation_item_id": BillingItem.objects.filter(code="OP-CONS")
                .values_list("id", flat=True)
                .first(),
            }
        )

    @action(detail=True, methods=["post"], url_path="revisit")
    def revisit(self, request, pk=None):
        patient = self.get_object()
        serializer = PatientRevisitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        doctor = serializer.validated_data["doctor"]
        kind = serializer.validated_data.get("registration_kind", RegistrationKind.REVISIT)
        branch_id = patient.branch_id
        reg = create_op_registration(
            patient=patient,
            doctor=doctor,
            branch_id=branch_id,
            registration_kind=kind,
            user=request.user,
        )
        patient.doctor = doctor
        patient.op_token = reg.op_token
        patient.updated_by = request.user
        patient.save(update_fields=["doctor", "op_token", "updated_by"])
        return Response(
            {
                "patient": patient.id,
                "uhid": patient.uhid,
                "name": patient.name,
                "doctor": doctor.id,
                "doctor_detail": {
                    "id": doctor.id,
                    "name": doctor.name,
                    "consultation_fee": str(doctor.consultation_fee),
                },
                "op_token": reg.op_token,
                "registration_kind": reg.registration_kind,
            },
            status=status.HTTP_201_CREATED,
        )
