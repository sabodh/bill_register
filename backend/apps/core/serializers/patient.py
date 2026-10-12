from rest_framework import serializers

from apps.core.models import Patient
from apps.core.services.uhid import generate_uhid


class PatientSerializer(serializers.ModelSerializer):
    age_years = serializers.IntegerField(read_only=True)

    class Meta:
        model = Patient
        fields = [
            "id",
            "uhid",
            "name",
            "gender",
            "date_of_birth",
            "age_years",
            "phone",
            "address",
            "branch",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["uhid", "created_at", "updated_at", "age_years"]

    def create(self, validated_data):
        if not validated_data.get("uhid"):
            validated_data["uhid"] = generate_uhid()
        user = self.context["request"].user
        validated_data.setdefault("created_by", user)
        validated_data.setdefault("updated_by", user)
        if not validated_data.get("branch") and user.branch_id:
            validated_data["branch_id"] = user.branch_id
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data["updated_by"] = self.context["request"].user
        return super().update(instance, validated_data)
