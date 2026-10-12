from django.contrib.auth.models import Group
from rest_framework import serializers

from apps.core.models import User


class UserSerializer(serializers.ModelSerializer):
    role_ids = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.all(),
        many=True,
        source="groups",
        required=False,
    )
    role_names = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "password",
            "email",
            "first_name",
            "last_name",
            "phone",
            "branch",
            "is_active",
            "is_staff",
            "role_ids",
            "role_names",
            "date_joined",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["date_joined", "created_at", "updated_at", "role_names"]
        extra_kwargs = {"password": {"write_only": True, "required": False}}

    def get_role_names(self, obj: User) -> list[str]:
        return list(obj.groups.values_list("name", flat=True))

    def create(self, validated_data):
        groups = validated_data.pop("groups", [])
        password = validated_data.pop("password", None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        if groups:
            user.groups.set(groups)
        return user

    def update(self, instance, validated_data):
        groups = validated_data.pop("groups", None)
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        if groups is not None:
            instance.groups.set(groups)
        return instance
