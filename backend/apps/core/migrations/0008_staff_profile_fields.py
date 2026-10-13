from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0007_departments"),
    ]

    operations = [
        migrations.AddField(
            model_name="staff",
            name="aadhar_number",
            field=models.CharField(blank=True, db_index=True, max_length=12),
        ),
        migrations.AddField(
            model_name="staff",
            name="address",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="staff",
            name="alternative_phone",
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AddField(
            model_name="staff",
            name="date_of_birth",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="staff",
            name="gender",
            field=models.CharField(
                blank=True,
                choices=[("M", "Male"), ("F", "Female"), ("O", "Other")],
                max_length=1,
            ),
        ),
        migrations.AddField(
            model_name="staff",
            name="name",
            field=models.CharField(blank=True, db_index=True, max_length=200),
        ),
        migrations.AlterField(
            model_name="staff",
            name="employee_id",
            field=models.CharField(blank=True, db_index=True, max_length=50),
        ),
        migrations.AlterField(
            model_name="staff",
            name="phone",
            field=models.CharField(
                blank=True, db_index=True, help_text="Mobile number", max_length=20
            ),
        ),
    ]
