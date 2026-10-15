from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("lab", "0005_lab_bill_line_result"),
    ]

    operations = [
        migrations.RenameField(
            model_name="labtest",
            old_name="test_type",
            new_name="test_category",
        ),
        migrations.AddField(
            model_name="labtest",
            name="test_type",
            field=models.CharField(
                blank=True,
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
                default="",
                max_length=16,
            ),
        ),
    ]
