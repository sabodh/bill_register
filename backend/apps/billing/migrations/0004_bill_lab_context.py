import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0008_staff_profile_fields"),
        ("billing", "0003_bill_payment_and_discount_type"),
    ]

    operations = [
        migrations.AddField(
            model_name="bill",
            name="doctor",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="bills",
                to="core.doctor",
            ),
        ),
        migrations.AddField(
            model_name="bill",
            name="hospital",
            field=models.ForeignKey(
                blank=True,
                help_text="Hospital printed on the bill (defaults to the bill branch).",
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="hospital_bills",
                to="core.branch",
            ),
        ),
        migrations.AddField(
            model_name="bill",
            name="sample_collected_at",
            field=models.DateTimeField(
                default=django.utils.timezone.now,
                help_text="Sample collection date and time for lab reports.",
            ),
        ),
    ]
