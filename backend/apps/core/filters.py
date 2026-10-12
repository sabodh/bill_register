import django_filters

from apps.core.models import Doctor, Patient, Staff, User


class PatientFilter(django_filters.FilterSet):
    is_active = django_filters.BooleanFilter()

    class Meta:
        model = Patient
        fields = ["branch", "gender", "is_active"]


class DoctorFilter(django_filters.FilterSet):
    is_active = django_filters.BooleanFilter()
    is_referral = django_filters.BooleanFilter()

    class Meta:
        model = Doctor
        fields = ["branch", "is_active", "is_referral"]


class StaffFilter(django_filters.FilterSet):
    is_active = django_filters.BooleanFilter()

    class Meta:
        model = Staff
        fields = ["branch", "is_active"]


class UserFilter(django_filters.FilterSet):
    is_active = django_filters.BooleanFilter()

    class Meta:
        model = User
        fields = ["branch", "is_active"]
