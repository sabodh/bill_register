from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("lab", "0002_lab_test_details"),
    ]

    operations = [
        migrations.AddField(
            model_name="labtestreferencerange",
            name="result_group",
            field=models.CharField(
                default="main",
                help_text="Rows sharing a group use one analysed result (e.g. all VARIANT rows).",
                max_length=32,
            ),
        ),
        migrations.AddField(
            model_name="labtestreferencerange",
            name="role",
            field=models.CharField(
                choices=[
                    ("SINGLE", "Single analyte"),
                    ("SUBTEST", "Panel subtest line"),
                    ("VARIANT", "Reference variant (e.g. sex / age band)"),
                ],
                default="SINGLE",
                max_length=16,
            ),
        ),
    ]
