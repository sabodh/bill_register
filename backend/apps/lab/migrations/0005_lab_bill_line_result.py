from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("billing", "0007_bill_sample_tested_at"),
        ("lab", "0004_lab_package"),
    ]

    operations = [
        migrations.CreateModel(
            name="LabBillLineResult",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("result_key", models.CharField(max_length=64)),
                ("value", models.TextField(blank=True)),
                (
                    "bill_line",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="lab_result_values",
                        to="billing.billline",
                    ),
                ),
            ],
            options={
                "constraints": [
                    models.UniqueConstraint(
                        fields=("bill_line", "result_key"),
                        name="lab_bill_line_result_line_key_uniq",
                    )
                ],
            },
        ),
    ]
