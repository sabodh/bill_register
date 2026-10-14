import django.db.models.deletion
from decimal import Decimal
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("lab", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="labtest",
            name="method_name",
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name="labtest",
            name="test_type",
            field=models.CharField(
                choices=[
                    ("NORMAL", "Normal"),
                    ("SUBTEST", "Subtest"),
                    ("SPECIAL", "Special test"),
                    ("MULTIPLE_REFERENCE", "Has multiple reference range"),
                ],
                default="NORMAL",
                max_length=32,
            ),
        ),
        migrations.CreateModel(
            name="LabTestInterpretation",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("note", models.TextField(blank=True)),
                ("sort_order", models.PositiveIntegerField(default=0)),
                (
                    "test",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="interpretations",
                        to="lab.labtest",
                    ),
                ),
            ],
            options={
                "ordering": ["sort_order", "id"],
            },
        ),
        migrations.CreateModel(
            name="LabTestReferenceRange",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("reference_text", models.CharField(blank=True, max_length=255)),
                ("low_value", models.DecimalField(blank=True, decimal_places=4, max_digits=14, null=True)),
                ("high_value", models.DecimalField(blank=True, decimal_places=4, max_digits=14, null=True)),
                ("unit", models.CharField(blank=True, max_length=32)),
                ("sort_order", models.PositiveIntegerField(default=0)),
                (
                    "test",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="reference_ranges",
                        to="lab.labtest",
                    ),
                ),
            ],
            options={
                "ordering": ["sort_order", "id"],
            },
        ),
    ]
