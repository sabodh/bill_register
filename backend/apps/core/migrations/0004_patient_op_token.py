from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0003_doctor_consultation_fee_patient_doctor_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="patient",
            name="op_token",
            field=models.PositiveIntegerField(
                blank=True,
                help_text="OP queue token for the assigned doctor on the registration day",
                null=True,
            ),
        ),
    ]
