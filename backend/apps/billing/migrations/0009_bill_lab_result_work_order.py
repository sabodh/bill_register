from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("billing", "0008_bill_advance_paid"),
    ]

    operations = [
        migrations.AddField(
            model_name="bill",
            name="lab_result_work_order",
            field=models.JSONField(
                blank=True,
                default=list,
                help_text="Ordered {bill_line_id, lab_test_id} pairs for lab result entry display.",
            ),
        ),
    ]
