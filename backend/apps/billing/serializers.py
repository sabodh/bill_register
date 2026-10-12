from decimal import Decimal

from rest_framework import serializers

from apps.billing.models import Bill, BillLine, BillingItem, ItemType


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
            "status",
            "total_amount",
            "notes",
            "branch",
            "lines",
            "created_at",
        ]
        read_only_fields = ["bill_number", "total_amount", "created_at"]


class BillCreateSerializer(serializers.ModelSerializer):
    lines = BillLineWriteSerializer(many=True, allow_empty=False)

    class Meta:
        model = Bill
        fields = ["patient", "notes", "lines"]

    def create(self, validated_data):
        lines_data = validated_data.pop("lines")
        user = self.context["request"].user
        branch_id = user.branch_id
        if not branch_id:
            raise serializers.ValidationError("User must belong to a branch to create bills.")
        from apps.billing.services.bill_number import generate_bill_number

        bill = Bill.objects.create(
            bill_number=generate_bill_number(),
            branch_id=branch_id,
            created_by=user,
            updated_by=user,
            **validated_data,
        )
        total = Decimal("0")
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
            total += amount
        bill.total_amount = total
        bill.save(update_fields=["total_amount"])
        return bill
