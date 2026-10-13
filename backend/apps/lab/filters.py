import django_filters

from apps.lab.models import LabTest, TestDepartment


class TestDepartmentFilter(django_filters.FilterSet):
    is_active = django_filters.BooleanFilter()

    class Meta:
        model = TestDepartment
        fields = ["branch", "is_active"]


class LabTestFilter(django_filters.FilterSet):
    is_active = django_filters.BooleanFilter()
    department = django_filters.NumberFilter()

    class Meta:
        model = LabTest
        fields = ["branch", "is_active", "department"]
