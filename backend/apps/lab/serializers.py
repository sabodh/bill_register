from rest_framework import serializers

from apps.lab.models import LabTest, TestDepartment


class TestDepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestDepartment
        fields = [
            "id",
            "name",
            "code",
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


class LabTestSerializer(serializers.ModelSerializer):
    department_detail = TestDepartmentSerializer(source="department", read_only=True)

    class Meta:
        model = LabTest
        fields = [
            "id",
            "department",
            "department_detail",
            "name",
            "code",
            "default_rate",
            "branch",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at", "department_detail"]

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
