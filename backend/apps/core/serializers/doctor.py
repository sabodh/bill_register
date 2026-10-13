from rest_framework import serializers

from apps.core.models import Doctor
from apps.core.serializers.doctor_department import DoctorDepartmentSerializer


class DoctorSerializer(serializers.ModelSerializer):
    department_detail = DoctorDepartmentSerializer(source="department", read_only=True)

    class Meta:
        model = Doctor
        fields = [
            "id",
            "department",
            "department_detail",
            "name",
            "qualification",
            "specialization",
            "registration_number",
            "phone",
            "consultation_fee",
            "revisit_period_days",
            "is_referral",
            "hospital_clinic_name",
            "branch",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def create(self, validated_data):
        user = self.context["request"].user
        validated_data.setdefault("created_by", user)
        validated_data.setdefault("updated_by", user)
        if not validated_data.get("branch") and user.branch_id:
            validated_data["branch_id"] = user.branch_id
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data["updated_by"] = self.context["request"].user
        return super().update(instance, validated_data)
