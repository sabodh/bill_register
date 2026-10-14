from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("billing", "0004_bill_lab_context"),
    ]

    operations = [
        migrations.AddField(
            model_name="bill",
            name="doctor_name",
            field=models.CharField(
                blank=True,
                help_text="Doctor name printed on the bill (may differ from the linked doctor).",
                max_length=200,
            ),
        ),
        migrations.AddField(
            model_name="bill",
            name="hospital_name",
            field=models.CharField(
                blank=True,
                help_text="Hospital name printed on the bill (may differ from the linked branch).",
                max_length=200,
            ),
        ),
    ]
