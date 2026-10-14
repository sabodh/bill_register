import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("billing", "0005_bill_doctor_hospital_names"),
        ("lab", "0004_lab_package"),
    ]

    operations = [
        migrations.AddField(
            model_name="billline",
            name="lab_test",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="bill_lines",
                to="lab.labtest",
            ),
        ),
        migrations.AddField(
            model_name="billline",
            name="lab_package",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="bill_lines",
                to="lab.labpackage",
            ),
        ),
    ]
