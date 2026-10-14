import django_filters
from django.db.models import Q

from apps.core.models import Doctor, DoctorDepartment, Patient, Staff, StaffDepartment, User


class PatientFilter(django_filters.FilterSet):
    is_active = django_filters.BooleanFilter()
    lookup = django_filters.CharFilter(method="filter_lookup")

    class Meta:
        model = Patient
        fields = ["branch", "gender", "is_active", "lookup"]

    def filter_lookup(self, queryset, name, value):
        term = (value or "").strip()
        if not term:
            return queryset
        q = (
            Q(name__icontains=term)
            | Q(phone__icontains=term)
            | Q(uhid__icontains=term)
            | Q(file_number__icontains=term)
        )
        if term.isdigit():
            q |= Q(op_token=int(term))
        return queryset.filter(q)


class DoctorFilter(django_filters.FilterSet):
    is_active = django_filters.BooleanFilter()
    is_referral = django_filters.BooleanFilter()
    department = django_filters.NumberFilter()

    class Meta:
        model = Doctor
        fields = ["branch", "is_active", "is_referral", "department"]


class DoctorDepartmentFilter(django_filters.FilterSet):
    is_active = django_filters.BooleanFilter()

    class Meta:
        model = DoctorDepartment
        fields = ["branch", "is_active"]


class StaffFilter(django_filters.FilterSet):
    is_active = django_filters.BooleanFilter()
    department = django_filters.NumberFilter()

    class Meta:
        model = Staff
        fields = ["branch", "is_active", "department"]


class StaffDepartmentFilter(django_filters.FilterSet):
    is_active = django_filters.BooleanFilter()

    class Meta:
        model = StaffDepartment
        fields = ["branch", "is_active"]


class UserFilter(django_filters.FilterSet):
    is_active = django_filters.BooleanFilter()

    class Meta:
        model = User
        fields = ["branch", "is_active"]
