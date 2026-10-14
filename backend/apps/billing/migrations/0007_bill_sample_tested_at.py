from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("billing", "0006_bill_line_lab_refs"),
    ]

    operations = [
        migrations.AddField(
            model_name="bill",
            name="sample_tested_at",
            field=models.DateTimeField(
                blank=True,
                help_text="Date and time when sample testing was completed (lab results).",
                null=True,
            ),
        ),
    ]
