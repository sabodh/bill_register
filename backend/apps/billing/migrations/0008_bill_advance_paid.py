from decimal import Decimal

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("billing", "0007_bill_sample_tested_at"),
    ]

    operations = [
        migrations.AddField(
            model_name="bill",
            name="advance_paid",
            field=models.DecimalField(
                decimal_places=2,
                default=Decimal("0"),
                help_text="Amount paid in advance toward this bill.",
                max_digits=14,
            ),
        ),
    ]
