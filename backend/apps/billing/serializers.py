from decimal import Decimal

from rest_framework import serializers

from apps.billing.models import Bill, BillLine, BillingItem, DiscountType, ItemType, PaymentMethod
from apps.billing.services.totals import compute_bill_totals
from apps.core.models import Branch, Doctor


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
    item_type = serializers.ChoiceField(choices=ItemType.choices, required=False)
    description = serializers.CharField(max_length=255)
    quantity = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal("0.01"))
    unit_price = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal("0"))


class BillSerializer(serializers.ModelSerializer):
    lines = BillLineSerializer(many=True, read_only=True)

    class Meta:
        model = Bill
        fields = [
            "id",
            "bill_number",
            "patient",
            "doctor",
            "doctor_name",
            "hospital",
            "hospital_name",
            "sample_collected_at",
            "status",
            "subtotal_amount",
            "discount_type",
            "discount_percent",
            "discount_amount",
            "discount_applied",
            "total_amount",
            "payment_method",
            "payment_transaction_id",
            "notes",
            "branch",
            "lines",
            "created_at",
        ]
        read_only_fields = ["bill_number", "total_amount", "created_at"]


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
    sample_collected_at = serializers.DateTimeField(required=False)

    class Meta:
        model = Bill
        fields = [
            "patient",
            "doctor",
            "doctor_name",
            "hospital",
            "hospital_name",
            "sample_collected_at",
            "notes",
            "lines",
            "discount_type",
            "discount_percent",
            "discount_amount",
            "payment_method",
            "payment_transaction_id",
        ]

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
        for line in lines:
            billing_item = line.get("billing_item")
            if billing_item is None:
                continue
            item_id = billing_item.pk
            if item_id in seen_billing_items:
                raise serializers.ValidationError(
                    {"lines": "Each test may only appear once on a bill."}
                )
            seen_billing_items.add(item_id)

        return attrs

    def create(self, validated_data):
        lines_data = validated_data.pop("lines")
        discount_type = validated_data.get("discount_type", DiscountType.NONE)
        discount_percent = validated_data.pop("discount_percent", Decimal("0"))
        discount_amount = validated_data.pop("discount_amount", Decimal("0"))
        user = self.context["request"].user
        branch_id = user.branch_id
        if not branch_id:
            raise serializers.ValidationError("User must belong to a branch to create bills.")
        from apps.billing.services.bill_number import generate_bill_number

        subtotal = Decimal("0")
        for index, line in enumerate(lines_data):
            item = line.get("billing_item")
            item_type = line.get("item_type") or (item.item_type if item else ItemType.OTHER)
            qty = line["quantity"]
            unit = line["unit_price"]
            amount = qty * unit
            subtotal += amount
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
        doctor_name = (validated_data.pop("doctor_name", "") or "").strip()
        doctor = validated_data.get("doctor")
        if doctor and not doctor_name:
            doctor_name = doctor.name
        if not doctor:
            validated_data["doctor"] = None
        validated_data["doctor_name"] = doctor_name

        hospital_name = (validated_data.pop("hospital_name", "") or "").strip()
        hospital = validated_data.get("hospital")
        if hospital:
            if not hospital_name:
                hospital_name = hospital.name
        else:
            validated_data.pop("hospital", None)
            if not hospital_name:
                default_branch = Branch.objects.get(pk=branch_id)
                validated_data["hospital_id"] = branch_id
                hospital_name = default_branch.name
        validated_data["hospital_name"] = hospital_name

        if "sample_collected_at" not in validated_data:
            from django.utils import timezone

            validated_data["sample_collected_at"] = timezone.now()

        bill = Bill.objects.create(
            bill_number=generate_bill_number(),
            branch_id=branch_id,
            created_by=user,
            updated_by=user,
            subtotal_amount=subtotal,
            discount_type=discount_type,
            discount_percent=discount_percent,
            discount_amount=discount_amount,
            discount_applied=discount_applied,
            total_amount=total,
            **validated_data,
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
                item_type=item_type,
                description=line["description"],
                quantity=qty,
                unit_price=unit,
                amount=amount,
                sort_order=index,
            )
        return bill
