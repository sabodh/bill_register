from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0008_staff_profile_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="branch",
            name="report_letterhead",
            field=models.ImageField(
                blank=True,
                help_text="Hospital letterhead for lab result PDFs (recommended width ~full A4).",
                null=True,
                upload_to="branch_letterheads/",
            ),
        ),
    ]
