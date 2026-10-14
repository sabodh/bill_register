from decimal import Decimal
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("billing", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="bill",
            name="discount_amount",
            field=models.DecimalField(
                decimal_places=2,
                default=Decimal("0"),
                help_text="Flat discount amount (added to percent discount)",
                max_digits=14,
            ),
        ),
        migrations.AddField(
            model_name="bill",
            name="discount_applied",
            field=models.DecimalField(
                decimal_places=2,
                default=Decimal("0"),
                help_text="Total discount deducted (percent + flat, capped at subtotal)",
                max_digits=14,
            ),
        ),
        migrations.AddField(
            model_name="bill",
            name="discount_percent",
            field=models.DecimalField(
                decimal_places=2,
                default=Decimal("0"),
                help_text="Discount percentage applied to subtotal",
                max_digits=5,
            ),
        ),
        migrations.AddField(
            model_name="bill",
            name="subtotal_amount",
            field=models.DecimalField(decimal_places=2, default=Decimal("0"), max_digits=14),
        ),
    ]
