from django.db import migrations, models


def set_blank_test_type_to_type_1(apps, schema_editor):
    LabTest = apps.get_model("lab", "LabTest")
    LabTest.objects.filter(test_type="").update(test_type="TYPE_1")


class Migration(migrations.Migration):
    dependencies = [
        ("lab", "0006_labtest_category_and_type_tier"),
    ]

    operations = [
        migrations.RunPython(set_blank_test_type_to_type_1, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="labtest",
            name="test_type",
            field=models.CharField(
                choices=[
                    ("TYPE_1", "Type-1"),
                    ("TYPE_2", "Type-2"),
                    ("TYPE_3", "Type-3"),
                    ("TYPE_4", "Type-4"),
                    ("TYPE_5", "Type-5"),
                    ("TYPE_6", "Type-6"),
                    ("TYPE_7", "Type-7"),
                    ("TYPE_8", "Type-8"),
                    ("TYPE_9", "Type-9"),
                    ("TYPE_10", "Type-10"),
                ],
                default="TYPE_1",
                max_length=16,
            ),
        ),
    ]
