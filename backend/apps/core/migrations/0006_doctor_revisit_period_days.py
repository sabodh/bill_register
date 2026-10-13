from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0005_opregistration"),
    ]

    operations = [
        migrations.AddField(
            model_name="doctor",
            name="revisit_period_days",
            field=models.PositiveSmallIntegerField(
                default=0,
                help_text="Free consultation revisit window after last visit with this doctor (0 = always charge).",
            ),
        ),
    ]
