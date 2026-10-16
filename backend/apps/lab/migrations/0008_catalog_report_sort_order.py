from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("lab", "0007_labtest_default_type_1"),
    ]

    operations = [
        migrations.AddField(
            model_name="testdepartment",
            name="sort_order",
            field=models.PositiveIntegerField(
                default=0,
                help_text="Order of department sections on patient lab reports.",
            ),
        ),
        migrations.AddField(
            model_name="labtest",
            name="sort_order",
            field=models.PositiveIntegerField(
                default=0,
                help_text="Order of tests within a department on patient lab reports.",
            ),
        ),
        migrations.AlterModelOptions(
            name="testdepartment",
            options={"ordering": ["sort_order", "name"]},
        ),
        migrations.AlterModelOptions(
            name="labtest",
            options={"ordering": ["sort_order", "name"], "verbose_name": "lab test", "verbose_name_plural": "lab tests"},
        ),
    ]
