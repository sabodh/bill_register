from rest_framework import serializers

from apps.core.models import Staff


class StaffSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True, allow_null=True)

    class Meta:
        model = Staff
        fields = [
            "id",
            "user",
            "username",
            "employee_id",
            "designation",
            "phone",
            "branch",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at", "username"]

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
