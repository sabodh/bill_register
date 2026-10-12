from django.db import migrations

from apps.core.permissions import DEFAULT_ROLE_PERMISSIONS


def create_module_permissions(apps, schema_editor):
    Permission = apps.get_model("auth", "Permission")
    ContentType = apps.get_model("contenttypes", "ContentType")

    module_perms = [
        ("lab", "test", "view_test", "Can view lab tests"),
        ("lab", "order", "add_order", "Can add lab orders"),
        ("billing", "bill", "view_bill", "Can view bills"),
        ("billing", "bill", "add_bill", "Can add bills"),
        ("pharmacy", "prescription", "view_prescription", "Can view prescriptions"),
        ("pharmacy", "prescription", "dispense", "Can dispense prescriptions"),
        ("clinical", "facesheet", "view_facesheet", "Can view face sheet"),
        ("clinical", "op", "view_op", "Can view OP"),
        ("reports", "report", "view_report", "Can view reports"),
        ("dashboard", "dashboard", "view_dashboard", "Can view dashboard"),
    ]
    for app_label, model, codename, name in module_perms:
        ct, _ = ContentType.objects.get_or_create(app_label=app_label, model=model)
        Permission.objects.get_or_create(codename=codename, name=name, content_type=ct)


def create_default_roles(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    Permission = apps.get_model("auth", "Permission")

    for role_name, perm_strings in DEFAULT_ROLE_PERMISSIONS.items():
        group, _ = Group.objects.get_or_create(name=role_name)
        perm_ids = []
        for codename in perm_strings:
            app_label, code = codename.split(".", 1)
            perm_ids.extend(
                Permission.objects.filter(content_type__app_label=app_label, codename=code)
            )
        group.permissions.set(perm_ids)


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0001_initial"),
        ("auth", "0012_alter_user_first_name_max_length"),
        ("contenttypes", "0002_remove_content_type_name"),
    ]

    operations = [
        migrations.RunPython(create_module_permissions, migrations.RunPython.noop),
        migrations.RunPython(create_default_roles, migrations.RunPython.noop),
    ]
