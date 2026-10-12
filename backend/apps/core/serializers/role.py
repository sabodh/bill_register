from django.contrib.auth.models import Group, Permission
from rest_framework import serializers


class RoleSerializer(serializers.ModelSerializer):
    permission_codenames = serializers.SerializerMethodField()
    permission_ids = serializers.PrimaryKeyRelatedField(
        queryset=Permission.objects.all(),
        many=True,
        source="permissions",
        required=False,
        write_only=True,
    )

    class Meta:
        model = Group
        fields = ["id", "name", "permission_codenames", "permission_ids"]
        read_only_fields = ["permission_codenames"]

    def get_permission_codenames(self, obj: Group) -> list[str]:
        return sorted(
            f"{p.content_type.app_label}.{p.codename}" for p in obj.permissions.select_related("content_type")
        )
