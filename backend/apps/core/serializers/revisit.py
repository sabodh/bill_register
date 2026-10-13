from rest_framework import serializers

from apps.core.models import Doctor, RegistrationKind


class PatientRevisitSerializer(serializers.Serializer):
    doctor = serializers.PrimaryKeyRelatedField(queryset=Doctor.objects.filter(is_active=True))
    registration_kind = serializers.ChoiceField(
        choices=RegistrationKind.choices,
        default=RegistrationKind.REVISIT,
    )
