from rest_framework import serializers

from apps.core.models import Doctor


class DoctorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Doctor
        fields = [
            "id",
            "name",
            "qualification",
            "specialization",
            "registration_number",
            "phone",
            "consultation_fee",
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
