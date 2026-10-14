from decimal import Decimal

from rest_framework import serializers

from apps.billing.models import Bill, BillLine, BillingItem, BillStatus, DiscountType, ItemType, PaymentMethod
from apps.billing.services.balance import balance_due_for_bill as _balance_due_for_bill
from apps.billing.services.lab_catalog import sync_lab_package_billing_item, sync_lab_test_billing_item
from apps.billing.services.totals import compute_bill_totals
from apps.core.models import Branch, Doctor
from apps.core.serializers.patient import PatientSerializer
from apps.lab.models import LabPackage, LabTest


class BillingItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillingItem
        fields = [
            "id",
            "code",
            "name",
            "item_type",
            "default_rate",
            "branch",
            "is_active",
        ]
        read_only_fields = ["branch"]


class BillLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillLine
        fields = [
            "id",
            "billing_item",
            "lab_test",
            "lab_package",
            "item_type",
            "description",
            "quantity",
            "unit_price",
            "amount",
            "sort_order",
        ]


class BillLineWriteSerializer(serializers.Serializer):
    billing_item = serializers.PrimaryKeyRelatedField(
        queryset=BillingItem.objects.all(),
        required=False,
        allow_null=True,
    )
    lab_test = serializers.PrimaryKeyRelatedField(
        queryset=LabTest.objects.filter(is_active=True),
        required=False,
        allow_null=True,
    )
    lab_package = serializers.PrimaryKeyRelatedField(
        queryset=LabPackage.objects.filter(is_active=True),
        required=False,
        allow_null=True,
    )
    item_type = serializers.ChoiceField(choices=ItemType.choices, required=False)
    description = serializers.CharField(max_length=255)
    quantity = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal("0.01"))
    unit_price = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal("0"))


class BillSerializer(serializers.ModelSerializer):
    lines = BillLineSerializer(many=True, read_only=True)
    patient_detail = PatientSerializer(source="patient", read_only=True)
    balance_due = serializers.SerializerMethodField()

    class Meta:
        model = Bill
        fields = [
            "id",
            "bill_number",
            "patient",
            "patient_detail",
            "doctor",
            "doctor_name",
            "hospital",
            "hospital_name",
            "sample_collected_at",
            "sample_tested_at",
            "status",
            "subtotal_amount",
            "discount_type",
            "discount_percent",
            "discount_amount",
            "discount_applied",
            "total_amount",
            "advance_paid",
            "balance_due",
            "payment_method",
            "payment_transaction_id",
            "notes",
            "branch",
            "lines",
            "created_at",
        ]
        read_only_fields = ["bill_number", "total_amount", "balance_due", "created_at"]

    def get_balance_due(self, obj: Bill) -> Decimal:
        return _balance_due_for_bill(obj)


class BillCreateSerializer(serializers.ModelSerializer):
    lines = BillLineWriteSerializer(many=True, allow_empty=False)
    discount_type = serializers.ChoiceField(
        choices=DiscountType.choices, required=False, default=DiscountType.NONE
    )
    discount_percent = serializers.DecimalField(
        max_digits=5, decimal_places=2, required=False, default=Decimal("0"), min_value=Decimal("0")
    )
    discount_amount = serializers.DecimalField(
        max_digits=14, decimal_places=2, required=False, default=Decimal("0"), min_value=Decimal("0")
    )
    payment_method = serializers.ChoiceField(
        choices=PaymentMethod.choices, required=False, default=PaymentMethod.CASH
    )
    payment_transaction_id = serializers.CharField(required=False, allow_blank=True, max_length=100)
    doctor = serializers.PrimaryKeyRelatedField(
        queryset=Doctor.objects.filter(is_active=True),
        required=False,
        allow_null=True,
    )
    hospital = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.filter(is_active=True),
        required=False,
        allow_null=True,
    )
    doctor_name = serializers.CharField(required=False, allow_blank=True, max_length=200)
    hospital_name = serializers.CharField(required=False, allow_blank=True, max_length=200)
    sample_collected_at = serializers.DateTimeField(required=False)
    sample_tested_at = serializers.DateTimeField(required=False, allow_null=True)
    advance_paid = serializers.DecimalField(
        max_digits=14, decimal_places=2, required=False, default=Decimal("0"), min_value=Decimal("0")
    )

    class Meta:
        model = Bill
        fields = [
            "patient",
            "doctor",
            "doctor_name",
            "hospital",
            "hospital_name",
            "sample_collected_at",
            "sample_tested_at",
            "notes",
            "lines",
            "discount_type",
            "discount_percent",
            "discount_amount",
            "advance_paid",
            "payment_method",
            "payment_transaction_id",
        ]

    @staticmethod
    def _validate_advance(advance: Decimal, total: Decimal) -> Decimal:
        if advance < 0:
            raise serializers.ValidationError({"advance_paid": "Advance cannot be negative."})
        if advance > total:
            raise serializers.ValidationError(
                {"advance_paid": "Advance cannot exceed bill total."}
            )
        return advance

    def validate(self, attrs):
        discount_type = attrs.get("discount_type", DiscountType.NONE)
        discount_percent = attrs.get("discount_percent") or Decimal("0")
        discount_amount = attrs.get("discount_amount") or Decimal("0")
        payment_method = attrs.get("payment_method", PaymentMethod.CASH)
        txn_id = (attrs.get("payment_transaction_id") or "").strip()

        if discount_type == DiscountType.PERCENT:
            if discount_amount > 0:
                raise serializers.ValidationError(
                    {"discount_amount": "Use either percent or amount discount, not both."}
                )
            if discount_percent > Decimal("100"):
                raise serializers.ValidationError(
                    {"discount_percent": "Discount percent cannot exceed 100."}
                )
        elif discount_type == DiscountType.AMOUNT:
            if discount_percent > 0:
                raise serializers.ValidationError(
                    {"discount_percent": "Use either percent or amount discount, not both."}
                )
        else:
            if discount_percent > 0 or discount_amount > 0:
                raise serializers.ValidationError(
                    {"discount_type": "Set discount type to PERCENT or AMOUNT when applying a discount."}
                )

        if payment_method in (PaymentMethod.UPI, PaymentMethod.CARD) and not txn_id:
            raise serializers.ValidationError(
                {"payment_transaction_id": "Transaction ID is required for UPI and Card payments."}
            )
        if payment_method not in (PaymentMethod.UPI, PaymentMethod.CARD):
            attrs["payment_transaction_id"] = ""
        else:
            attrs["payment_transaction_id"] = txn_id

        lines = attrs.get("lines") or []
        seen_billing_items: set[int] = set()
        seen_lab_tests: set[int] = set()
        seen_lab_packages: set[int] = set()
        for line in lines:
            lab_test = line.get("lab_test")
            lab_package = line.get("lab_package")
            billing_item = line.get("billing_item")
            if lab_test and lab_package:
                raise serializers.ValidationError(
                    {"lines": "A line cannot reference both a lab test and a lab package."}
                )
            if lab_test:
                if lab_test.pk in seen_lab_tests:
                    raise serializers.ValidationError(
                        {"lines": "Each lab test may only appear once on a bill."}
                    )
                seen_lab_tests.add(lab_test.pk)
            if lab_package:
                if lab_package.pk in seen_lab_packages:
                    raise serializers.ValidationError(
                        {"lines": "Each lab package may only appear once on a bill."}
                    )
                seen_lab_packages.add(lab_package.pk)
            if billing_item is None:
                continue
            item_id = billing_item.pk
            if item_id in seen_billing_items:
                raise serializers.ValidationError(
                    {"lines": "Each test may only appear once on a bill."}
                )
            seen_billing_items.add(item_id)

        return attrs

    @staticmethod
    def _resolve_line_catalog_refs(line: dict) -> None:
        lab_test = line.pop("lab_test", None)
        lab_package = line.pop("lab_package", None)
        if lab_test is not None:
            item = sync_lab_test_billing_item(lab_test)
            if item is None:
                raise serializers.ValidationError(
                    {"lines": f"Lab test “{lab_test.name}” has no branch and cannot be billed."}
                )
            line["billing_item"] = item
            line["lab_test"] = lab_test
            if not line.get("item_type"):
                line["item_type"] = ItemType.LAB
        elif lab_package is not None:
            item = sync_lab_package_billing_item(lab_package)
            if item is None:
                raise serializers.ValidationError(
                    {"lines": f"Lab package “{lab_package.name}” has no branch and cannot be billed."}
                )
            line["billing_item"] = item
            line["lab_package"] = lab_package
            if not line.get("item_type"):
                line["item_type"] = ItemType.LAB

    def create(self, validated_data):
        lines_data = validated_data.pop("lines")
        for line in lines_data:
            self._resolve_line_catalog_refs(line)

        discount_type = validated_data.pop("discount_type", DiscountType.NONE)
        discount_percent = validated_data.pop("discount_percent", Decimal("0"))
        discount_amount = validated_data.pop("discount_amount", Decimal("0"))
        payment_method = validated_data.pop("payment_method", PaymentMethod.CASH)
        payment_transaction_id = validated_data.pop("payment_transaction_id", "") or ""
        advance_paid = validated_data.pop("advance_paid", Decimal("0")) or Decimal("0")
        patient = validated_data.pop("patient")
        notes = validated_data.pop("notes", "") or ""
        sample_collected_at = validated_data.pop("sample_collected_at", None)
        sample_tested_at = validated_data.pop("sample_tested_at", None)

        user = self.context["request"].user
        branch_id = user.branch_id
        if not branch_id:
            raise serializers.ValidationError("User must belong to a branch to create bills.")

        doctor_name = (validated_data.pop("doctor_name", "") or "").strip()
        doctor = validated_data.pop("doctor", None)
        if doctor and not doctor_name:
            doctor_name = doctor.name

        hospital_name = (validated_data.pop("hospital_name", "") or "").strip()
        hospital = validated_data.pop("hospital", None)
        hospital_id = hospital.pk if hospital else None
        if hospital and not hospital_name:
            hospital_name = hospital.name

        if sample_collected_at is None:
            from django.utils import timezone

            sample_collected_at = timezone.now()

        if validated_data:
            raise serializers.ValidationError(
                {"non_field_errors": f"Unexpected bill fields: {', '.join(sorted(validated_data))}"}
            )

        from apps.billing.services.bill_number import generate_bill_number

        subtotal = Decimal("0")
        for line in lines_data:
            qty = line["quantity"]
            unit = line["unit_price"]
            subtotal += qty * unit
        if discount_type == DiscountType.PERCENT:
            discount_amount = Decimal("0")
        elif discount_type == DiscountType.AMOUNT:
            discount_percent = Decimal("0")
        else:
            discount_percent = Decimal("0")
            discount_amount = Decimal("0")

        subtotal, _from_pct, discount_applied, total = compute_bill_totals(
            subtotal, discount_type, discount_percent, discount_amount
        )
        advance_paid = self._validate_advance(advance_paid, total)

        bill = Bill.objects.create(
            bill_number=generate_bill_number(),
            branch_id=branch_id,
            created_by=user,
            updated_by=user,
            status=BillStatus.FINAL,
            patient=patient,
            doctor=doctor,
            doctor_name=doctor_name,
            hospital_id=hospital_id,
            hospital_name=hospital_name,
            sample_collected_at=sample_collected_at,
            sample_tested_at=sample_tested_at,
            notes=notes,
            payment_method=payment_method,
            payment_transaction_id=payment_transaction_id,
            subtotal_amount=subtotal,
            discount_type=discount_type,
            discount_percent=discount_percent,
            discount_amount=discount_amount,
            discount_applied=discount_applied,
            total_amount=total,
            advance_paid=advance_paid,
        )
        for index, line in enumerate(lines_data):
            item = line.get("billing_item")
            item_type = line.get("item_type") or (item.item_type if item else ItemType.OTHER)
            qty = line["quantity"]
            unit = line["unit_price"]
            amount = qty * unit
            BillLine.objects.create(
                bill=bill,
                billing_item=item,
                lab_test=line.get("lab_test"),
                lab_package=line.get("lab_package"),
                item_type=item_type,
                description=line["description"],
                quantity=qty,
                unit_price=unit,
                amount=amount,
                sort_order=index,
            )
        return bill


class BillUpdateSerializer(BillCreateSerializer):
    def update(self, instance, validated_data):
        if instance.status == BillStatus.CANCELLED:
            raise serializers.ValidationError("Cancelled bills cannot be edited.")
        lines_data = validated_data.pop("lines")
        for line in lines_data:
            self._resolve_line_catalog_refs(line)

        discount_type = validated_data.pop("discount_type", DiscountType.NONE)
        discount_percent = validated_data.pop("discount_percent", Decimal("0"))
        discount_amount = validated_data.pop("discount_amount", Decimal("0"))
        payment_method = validated_data.pop("payment_method", PaymentMethod.CASH)
        payment_transaction_id = validated_data.pop("payment_transaction_id", "") or ""
        advance_paid = validated_data.pop("advance_paid", Decimal("0")) or Decimal("0")
        patient = validated_data.pop("patient")
        notes = validated_data.pop("notes", "") or ""
        sample_collected_at = validated_data.pop("sample_collected_at", None)
        sample_tested_at = validated_data.pop("sample_tested_at", None)

        user = self.context["request"].user
        branch_id = user.branch_id
        if not branch_id:
            raise serializers.ValidationError("User must belong to a branch to update bills.")
        if instance.branch_id != branch_id:
            raise serializers.ValidationError("You cannot edit bills from another branch.")

        doctor_name = (validated_data.pop("doctor_name", "") or "").strip()
        doctor = validated_data.pop("doctor", None)
        if doctor and not doctor_name:
            doctor_name = doctor.name

        hospital_name = (validated_data.pop("hospital_name", "") or "").strip()
        hospital = validated_data.pop("hospital", None)
        hospital_id = hospital.pk if hospital else None
        if hospital and not hospital_name:
            hospital_name = hospital.name

        if sample_collected_at is None:
            sample_collected_at = instance.sample_collected_at

        if validated_data:
            raise serializers.ValidationError(
                {"non_field_errors": f"Unexpected bill fields: {', '.join(sorted(validated_data))}"}
            )

        subtotal = Decimal("0")
        for line in lines_data:
            qty = line["quantity"]
            unit = line["unit_price"]
            subtotal += qty * unit
        if discount_type == DiscountType.PERCENT:
            discount_amount = Decimal("0")
        elif discount_type == DiscountType.AMOUNT:
            discount_percent = Decimal("0")
        else:
            discount_percent = Decimal("0")
            discount_amount = Decimal("0")

        subtotal, _from_pct, discount_applied, total = compute_bill_totals(
            subtotal, discount_type, discount_percent, discount_amount
        )
        advance_paid = self._validate_advance(advance_paid, total)

        instance.patient = patient
        instance.doctor = doctor
        instance.doctor_name = doctor_name
        instance.hospital_id = hospital_id
        instance.hospital_name = hospital_name
        instance.sample_collected_at = sample_collected_at
        instance.sample_tested_at = sample_tested_at
        instance.notes = notes
        instance.payment_method = payment_method
        instance.payment_transaction_id = payment_transaction_id
        instance.subtotal_amount = subtotal
        instance.discount_type = discount_type
        instance.discount_percent = discount_percent
        instance.discount_amount = discount_amount
        instance.discount_applied = discount_applied
        instance.total_amount = total
        instance.advance_paid = advance_paid
        instance.status = BillStatus.FINAL
        instance.updated_by = user
        instance.save()

        instance.lines.all().delete()
        for index, line in enumerate(lines_data):
            item = line.get("billing_item")
            item_type = line.get("item_type") or (item.item_type if item else ItemType.OTHER)
            qty = line["quantity"]
            unit = line["unit_price"]
            amount = qty * unit
            BillLine.objects.create(
                bill=instance,
                billing_item=item,
                lab_test=line.get("lab_test"),
                lab_package=line.get("lab_package"),
                item_type=item_type,
                description=line["description"],
                quantity=qty,
                unit_price=unit,
                amount=amount,
                sort_order=index,
            )
        return instance


class BillLabSessionSerializer(serializers.ModelSerializer):
    doctor = serializers.PrimaryKeyRelatedField(
        queryset=Doctor.objects.filter(is_active=True),
        required=False,
        allow_null=True,
    )
    hospital = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.filter(is_active=True),
        required=False,
        allow_null=True,
    )
    doctor_name = serializers.CharField(required=False, allow_blank=True, max_length=200)
    hospital_name = serializers.CharField(required=False, allow_blank=True, max_length=200)
    sample_tested_at = serializers.DateTimeField(required=False, allow_null=True)

    class Meta:
        model = Bill
        fields = [
            "doctor",
            "doctor_name",
            "hospital",
            "hospital_name",
            "sample_collected_at",
            "sample_tested_at",
        ]

    def update(self, instance, validated_data):
        if instance.status == BillStatus.CANCELLED:
            raise serializers.ValidationError("Cancelled bills cannot be edited.")
        user = self.context["request"].user
        branch_id = user.branch_id
        if instance.branch_id != branch_id:
            raise serializers.ValidationError("You cannot edit bills from another branch.")

        doctor_name = (validated_data.pop("doctor_name", instance.doctor_name) or "").strip()
        doctor = validated_data.pop("doctor", instance.doctor)
        if doctor and not doctor_name:
            doctor_name = doctor.name

        hospital_name = (validated_data.pop("hospital_name", instance.hospital_name) or "").strip()
        hospital = validated_data.pop("hospital", instance.hospital)
        hospital_id = hospital.pk if hospital else None
        if hospital and not hospital_name:
            hospital_name = hospital.name

        instance.doctor = doctor
        instance.doctor_name = doctor_name
        instance.hospital_id = hospital_id
        instance.hospital_name = hospital_name
        if "sample_collected_at" in validated_data:
            instance.sample_collected_at = validated_data["sample_collected_at"]
        if "sample_tested_at" in validated_data:
            instance.sample_tested_at = validated_data["sample_tested_at"]
        instance.updated_by = user
        instance.save()
        return instance
