from datetime import date

from rest_framework import serializers

from apps.core.models import Patient, RegistrationKind
from apps.core.serializers.doctor import DoctorSerializer
from apps.core.services.op_token import create_op_registration
from apps.core.services.uhid import generate_uhid


def _dob_from_age_years(age: int) -> date:
    today = date.today()
    year = today.year - age
    try:
        return date(year, today.month, today.day)
    except ValueError:
        return date(year, today.month, 28)


class PatientSerializer(serializers.ModelSerializer):
    doctor_detail = DoctorSerializer(source="doctor", read_only=True)
    age_years = serializers.IntegerField(read_only=True)
    age = serializers.IntegerField(
        write_only=True,
        required=False,
        min_value=0,
        max_value=150,
        help_text="If date_of_birth is omitted, age is used to estimate DOB.",
    )
    registration_kind = serializers.ChoiceField(
        choices=RegistrationKind.choices,
        write_only=True,
        required=False,
        default=RegistrationKind.NEW_OP,
    )

    class Meta:
        model = Patient
        fields = [
            "id",
            "uhid",
            "name",
            "gender",
            "date_of_birth",
            "age_years",
            "age",
            "phone",
            "address",
            "file_number",
            "doctor",
            "doctor_detail",
            "registration_kind",
            "op_token",
            "branch",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["uhid", "op_token", "created_at", "updated_at", "age_years"]

    def validate(self, attrs):
        age = attrs.pop("age", None)
        dob = attrs.get("date_of_birth")
        if dob is None and age is not None:
            attrs["date_of_birth"] = _dob_from_age_years(age)
        return attrs

    def create(self, validated_data):
        if not validated_data.get("uhid"):
            validated_data["uhid"] = generate_uhid()
        if not validated_data.get("file_number"):
            validated_data["file_number"] = validated_data["uhid"]
        user = self.context["request"].user
        validated_data.setdefault("created_by", user)
        validated_data.setdefault("updated_by", user)
        if not validated_data.get("branch") and user.branch_id:
            validated_data["branch_id"] = user.branch_id
        registration_kind = validated_data.pop("registration_kind", RegistrationKind.NEW_OP)
        doctor = validated_data.get("doctor")
        branch = validated_data.get("branch")
        branch_id = validated_data.get("branch_id") or (branch.pk if branch else None)
        patient = super().create(validated_data)
        if doctor and branch_id:
            reg = create_op_registration(
                patient=patient,
                doctor=doctor,
                branch_id=branch_id,
                registration_kind=registration_kind,
                user=user,
            )
            patient.op_token = reg.op_token
            patient.save(update_fields=["op_token"])
        return patient

    def update(self, instance, validated_data):
        validated_data["updated_by"] = self.context["request"].user
        return super().update(instance, validated_data)
