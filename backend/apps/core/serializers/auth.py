from rest_framework import serializers

from apps.core.models import User
from apps.core.serializers.branch import BranchSerializer


class MeSerializer(serializers.ModelSerializer):
    permissions = serializers.SerializerMethodField()
    branch_detail = BranchSerializer(source="branch", read_only=True)
    roles = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone",
            "branch",
            "branch_detail",
            "roles",
            "permissions",
        ]

    def get_permissions(self, obj: User) -> list[str]:
        return obj.get_permission_codenames()

    def get_roles(self, obj: User) -> list[str]:
        return list(obj.groups.values_list("name", flat=True))
