from decimal import Decimal
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("billing", "0002_bill_discount_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="bill",
            name="discount_type",
            field=models.CharField(
                choices=[("NONE", "None"), ("PERCENT", "Percent"), ("AMOUNT", "Amount")],
                default="NONE",
                max_length=16,
            ),
        ),
        migrations.AddField(
            model_name="bill",
            name="payment_method",
            field=models.CharField(
                choices=[
                    ("CASH", "Cash"),
                    ("UPI", "UPI"),
                    ("CARD", "Card"),
                    ("CREDIT", "Credit"),
                ],
                default="CASH",
                max_length=16,
            ),
        ),
        migrations.AddField(
            model_name="bill",
            name="payment_transaction_id",
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AlterField(
            model_name="bill",
            name="discount_amount",
            field=models.DecimalField(
                decimal_places=2,
                default=Decimal("0"),
                help_text="Used when discount_type is AMOUNT",
                max_digits=14,
            ),
        ),
        migrations.AlterField(
            model_name="bill",
            name="discount_applied",
            field=models.DecimalField(
                decimal_places=2,
                default=Decimal("0"),
                help_text="Total discount deducted (capped at subtotal)",
                max_digits=14,
            ),
        ),
        migrations.AlterField(
            model_name="bill",
            name="discount_percent",
            field=models.DecimalField(
                decimal_places=2,
                default=Decimal("0"),
                help_text="Used when discount_type is PERCENT",
                max_digits=5,
            ),
        ),
    ]
