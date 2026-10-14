import django.db.models.deletion
from decimal import Decimal
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0008_staff_profile_fields"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("lab", "0003_reference_range_role"),
    ]

    operations = [
        migrations.CreateModel(
            name="LabPackage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("name", models.CharField(db_index=True, max_length=200)),
                (
                    "package_amount",
                    models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12),
                ),
                ("is_active", models.BooleanField(default=True)),
                (
                    "branch",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="%(class)s_set",
                        to="core.branch",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_created",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_updated",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["name"],
            },
        ),
        migrations.AddConstraint(
            model_name="labpackage",
            constraint=models.UniqueConstraint(
                fields=("branch", "name"),
                name="lab_package_branch_name_uniq",
            ),
        ),
        migrations.CreateModel(
            name="LabPackageItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("sort_order", models.PositiveIntegerField(default=0)),
                (
                    "package",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="items",
                        to="lab.labpackage",
                    ),
                ),
                (
                    "test",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="package_items",
                        to="lab.labtest",
                    ),
                ),
            ],
            options={
                "ordering": ["sort_order", "id"],
            },
        ),
        migrations.AddConstraint(
            model_name="labpackageitem",
            constraint=models.UniqueConstraint(
                fields=("package", "test"),
                name="lab_package_item_package_test_uniq",
            ),
        ),
    ]
