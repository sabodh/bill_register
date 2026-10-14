from rest_framework import serializers

from apps.billing.models import Bill
from apps.billing.services.balance import balance_due_for_bill
from apps.billing.serializers import BillLabSessionSerializer
from apps.core.models import Branch, Doctor
from apps.lab.services.result_completion import bill_result_completion_summary
from apps.lab.services.result_values import saved_results_for_bill, upsert_lab_bill_line_results
from apps.lab.services.result_worklist import build_lab_result_work_items


class LabResultPatientSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    uhid = serializers.CharField()
    name = serializers.CharField()
    gender = serializers.CharField()
    age_years = serializers.IntegerField(allow_null=True)
    phone = serializers.CharField()


class LabResultBillListSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.name", read_only=True)
    patient_uhid = serializers.CharField(source="patient.uhid", read_only=True)
    work_item_count = serializers.SerializerMethodField()
    billing_completed = serializers.SerializerMethodField()
    results_completed = serializers.SerializerMethodField()
    result_slots_filled = serializers.SerializerMethodField()
    result_slots_total = serializers.SerializerMethodField()
    balance_due = serializers.SerializerMethodField()

    class Meta:
        model = Bill
        fields = [
            "id",
            "bill_number",
            "patient",
            "patient_name",
            "patient_uhid",
            "sample_collected_at",
            "doctor_name",
            "hospital_name",
            "total_amount",
            "advance_paid",
            "balance_due",
            "work_item_count",
            "billing_completed",
            "results_completed",
            "result_slots_filled",
            "result_slots_total",
            "created_at",
        ]

    def get_balance_due(self, obj: Bill):
        return balance_due_for_bill(obj)

    def get_work_item_count(self, obj: Bill) -> int:
        return len(build_lab_result_work_items(obj))

    def _completion(self, obj: Bill) -> dict:
        cached = getattr(obj, "_result_completion_cache", None)
        if cached is None:
            cached = bill_result_completion_summary(obj)
            obj._result_completion_cache = cached
        return cached

    def get_billing_completed(self, obj: Bill) -> bool:
        return self._completion(obj)["billing_completed"]

    def get_results_completed(self, obj: Bill) -> bool:
        return self._completion(obj)["results_completed"]

    def get_result_slots_filled(self, obj: Bill) -> int:
        return self._completion(obj)["result_slots_filled"]

    def get_result_slots_total(self, obj: Bill) -> int:
        return self._completion(obj)["result_slots_total"]


class NullablePKIntegerField(serializers.IntegerField):
    """Accept null, blank, or omitted PK (doctor / hospital optional)."""

    def to_internal_value(self, data):
        if data is None or data == "":
            return None
        return super().to_internal_value(data)


class LabResultValueSerializer(serializers.Serializer):
    bill_line_id = serializers.IntegerField()
    lab_test_id = serializers.IntegerField()
    result_key = serializers.CharField(max_length=64)
    value = serializers.CharField(allow_blank=True, required=False, default="")


class LabResultSaveSerializer(serializers.Serializer):
    doctor = NullablePKIntegerField(required=False, allow_null=True)
    hospital = NullablePKIntegerField(required=False, allow_null=True)
    doctor_name = serializers.CharField(required=False, allow_blank=True)
    hospital_name = serializers.CharField(required=False, allow_blank=True)
    sample_collected_at = serializers.DateTimeField(required=False, allow_null=True)
    sample_tested_at = serializers.DateTimeField(required=False, allow_null=True)
    results = LabResultValueSerializer(many=True, required=False, allow_null=True, default=list)

    def validate(self, attrs):
        doctor_id = attrs.get("doctor")
        if doctor_id is not None and not Doctor.objects.filter(pk=doctor_id, is_active=True).exists():
            attrs["doctor"] = None
        hospital_id = attrs.get("hospital")
        if hospital_id is not None and not Branch.objects.filter(pk=hospital_id, is_active=True).exists():
            attrs["hospital"] = None
        if attrs.get("results") is None:
            attrs["results"] = []
        return attrs

    def save(self, bill: Bill) -> Bill:
        request = self.context["request"]
        session_data = {
            key: self.validated_data[key]
            for key in (
                "doctor",
                "doctor_name",
                "hospital",
                "hospital_name",
                "sample_collected_at",
                "sample_tested_at",
            )
            if key in self.validated_data
        }
        if session_data:
            session_serializer = BillLabSessionSerializer(
                bill,
                data=session_data,
                partial=True,
                context=self.context,
            )
            session_serializer.is_valid(raise_exception=True)
            bill = session_serializer.save()

        entries = self.validated_data.get("results") or []
        if entries:
            try:
                upsert_lab_bill_line_results(
                    bill,
                    entries,
                    user_branch_id=request.user.branch_id,
                )
            except ValueError as exc:
                raise serializers.ValidationError(str(exc)) from exc
        return bill


class LabResultBillDetailSerializer(serializers.ModelSerializer):
    patient_detail = serializers.SerializerMethodField()
    work_items = serializers.SerializerMethodField()
    saved_results = serializers.SerializerMethodField()

    class Meta:
        model = Bill
        fields = [
            "id",
            "bill_number",
            "patient",
            "patient_detail",
            "doctor",
            "doctor_name",
            "hospital",
            "hospital_name",
            "sample_collected_at",
            "sample_tested_at",
            "total_amount",
            "notes",
            "work_items",
            "saved_results",
            "created_at",
        ]

    def get_patient_detail(self, obj: Bill) -> dict | None:
        patient = obj.patient
        if not patient:
            return None
        return LabResultPatientSerializer(
            {
                "id": patient.id,
                "uhid": patient.uhid,
                "name": patient.name,
                "gender": patient.gender,
                "age_years": patient.age_years,
                "phone": patient.phone,
            }
        ).data

    def get_work_items(self, obj: Bill) -> list[dict]:
        return [item.to_dict() for item in build_lab_result_work_items(obj)]

    def get_saved_results(self, obj: Bill) -> list[dict]:
        return saved_results_for_bill(obj)
