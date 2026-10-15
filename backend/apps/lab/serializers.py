from rest_framework import serializers

from apps.billing.services.lab_catalog import sync_lab_package_billing_item, sync_lab_test_billing_item
from apps.lab.models import (
    LabPackage,
    LabPackageItem,
    LabTest,
    LabTestInterpretation,
    LabTestReferenceRange,
    ReferenceRowRole,
    TestDepartment,
    TestType,
)
from apps.lab.services.result_template import build_result_entry_layout


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


class LabTestReferenceRangeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabTestReferenceRange
        fields = [
            "id",
            "role",
            "result_group",
            "reference_text",
            "low_value",
            "high_value",
            "unit",
            "sort_order",
        ]


class LabTestInterpretationSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabTestInterpretation
        fields = ["id", "note", "sort_order"]


def _role_and_group(test_category: str, index: int) -> tuple[str, str]:
    if test_category == TestType.SUBTEST:
        return ReferenceRowRole.SUBTEST, f"row-{index}"
    if test_category == TestType.MULTIPLE_REFERENCE:
        return ReferenceRowRole.VARIANT, "main"
    return ReferenceRowRole.SINGLE, "main"


def _sync_reference_ranges(test: LabTest, rows: list[dict]) -> None:
    test.reference_ranges.all().delete()
    if test.test_category == TestType.SPECIAL:
        return
    for index, row in enumerate(rows):
        role, result_group = _role_and_group(test.test_category, index)
        LabTestReferenceRange.objects.create(
            test=test,
            role=role,
            result_group=result_group,
            reference_text=row.get("reference_text") or "",
            low_value=row.get("low_value"),
            high_value=row.get("high_value"),
            unit=row.get("unit") or "",
            sort_order=index,
        )


def _sync_interpretations(test: LabTest, rows: list[dict]) -> None:
    test.interpretations.all().delete()
    if test.test_category == TestType.SPECIAL:
        return
    for index, row in enumerate(rows):
        LabTestInterpretation.objects.create(
            test=test,
            note=row.get("note") or "",
            sort_order=index,
        )


class LabPackageTestSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = LabTest
        fields = ["id", "name", "code", "default_rate"]


class LabPackageItemSerializer(serializers.ModelSerializer):
    test_detail = LabPackageTestSummarySerializer(source="test", read_only=True)

    class Meta:
        model = LabPackageItem
        fields = ["id", "test", "test_detail", "sort_order"]


class LabPackageItemWriteSerializer(serializers.Serializer):
    test = serializers.PrimaryKeyRelatedField(queryset=LabTest.objects.filter(is_active=True))


def _sync_package_items(package: LabPackage, items_data: list[dict]) -> None:
    package.items.all().delete()
    for index, item in enumerate(items_data):
        LabPackageItem.objects.create(package=package, test=item["test"], sort_order=index)


class LabPackageSerializer(serializers.ModelSerializer):
    items = LabPackageItemSerializer(many=True, read_only=True)

    class Meta:
        model = LabPackage
        fields = [
            "id",
            "name",
            "package_amount",
            "items",
            "branch",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class LabPackageWriteSerializer(serializers.ModelSerializer):
    items = LabPackageItemWriteSerializer(many=True, allow_empty=False)

    class Meta:
        model = LabPackage
        fields = ["name", "package_amount", "items", "is_active"]

    def validate(self, attrs):
        items = attrs.get("items") or []
        seen: set[int] = set()
        for item in items:
            test = item.get("test")
            if test is None:
                continue
            test_id = test.pk
            if test_id in seen:
                raise serializers.ValidationError(
                    {"items": "Each test may only appear once in a package."}
                )
            seen.add(test_id)
        return attrs

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        user = self.context["request"].user
        validated_data.setdefault("created_by", user)
        validated_data.setdefault("updated_by", user)
        if not validated_data.get("branch") and user.branch_id:
            validated_data["branch_id"] = user.branch_id
        package = super().create(validated_data)
        _sync_package_items(package, items_data)
        sync_lab_package_billing_item(package)
        return package

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)
        validated_data["updated_by"] = self.context["request"].user
        package = super().update(instance, validated_data)
        if items_data is not None:
            _sync_package_items(package, items_data)
        sync_lab_package_billing_item(package)
        return package


class LabTestSerializer(serializers.ModelSerializer):
    department_detail = TestDepartmentSerializer(source="department", read_only=True)
    reference_ranges = LabTestReferenceRangeSerializer(many=True, required=False)
    interpretations = LabTestInterpretationSerializer(many=True, required=False)
    result_entry_layout = serializers.SerializerMethodField()

    class Meta:
        model = LabTest
        fields = [
            "id",
            "department",
            "department_detail",
            "name",
            "code",
            "method_name",
            "test_category",
            "test_type",
            "default_rate",
            "reference_ranges",
            "interpretations",
            "result_entry_layout",
            "branch",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at", "department_detail", "result_entry_layout"]

    def get_result_entry_layout(self, obj: LabTest) -> dict:
        return build_result_entry_layout(obj)

    def create(self, validated_data):
        ranges = validated_data.pop("reference_ranges", [])
        notes = validated_data.pop("interpretations", [])
        user = self.context["request"].user
        validated_data.setdefault("created_by", user)
        validated_data.setdefault("updated_by", user)
        if not validated_data.get("branch") and user.branch_id:
            validated_data["branch_id"] = user.branch_id
        test = super().create(validated_data)
        _sync_reference_ranges(test, ranges)
        _sync_interpretations(test, notes)
        sync_lab_test_billing_item(test)
        return test

    def update(self, instance, validated_data):
        ranges = validated_data.pop("reference_ranges", None)
        notes = validated_data.pop("interpretations", None)
        validated_data["updated_by"] = self.context["request"].user
        test = super().update(instance, validated_data)
        if ranges is not None:
            _sync_reference_ranges(test, ranges)
        if notes is not None:
            _sync_interpretations(test, notes)
        sync_lab_test_billing_item(test)
        return test
