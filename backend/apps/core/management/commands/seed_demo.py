from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand

from apps.billing.models import BillingItem, ItemType
from apps.core.models import Branch, Doctor, Patient, User
from apps.core.permissions import DEFAULT_ROLE_PERMISSIONS
from apps.core.services.uhid import generate_uhid


def ensure_roles():
    from django.contrib.auth.models import Permission
    from django.contrib.contenttypes.models import ContentType

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

    for role_name, perm_strings in DEFAULT_ROLE_PERMISSIONS.items():
        group, _ = Group.objects.get_or_create(name=role_name)
        perms = []
        for codename in perm_strings:
            app_label, code = codename.split(".", 1)
            perms.extend(
                Permission.objects.filter(content_type__app_label=app_label, codename=code)
            )
        group.permissions.set(perms)


class Command(BaseCommand):
    help = "Seed demo roles, admin user, patients, and doctors"

    def handle(self, *args, **options):
        ensure_roles()

        branch, _ = Branch.objects.get_or_create(
            code="MAIN",
            defaults={"name": "Main Hospital", "phone": "1800123456", "address": "Demo City"},
        )

        admin_group = Group.objects.get(name="Admin")
        admin, created = User.objects.get_or_create(
            username="admin",
            defaults={
                "email": "admin@hms.local",
                "branch": branch,
                "is_staff": True,
            },
        )
        admin.set_password("adminpass123")
        admin.is_active = True
        admin.branch = branch
        admin.is_staff = True
        admin.save()
        admin.groups.set([admin_group])

        if Patient.objects.count() < 20:
            genders = ["M", "F", "O"]
            for i in range(20 - Patient.objects.count()):
                Patient.objects.create(
                    uhid=generate_uhid(),
                    name=f"Demo Patient {i + 1}",
                    gender=genders[i % 3],
                    phone=f"98{100000000 + i}",
                    address=f"Demo address {i + 1}",
                    branch=branch,
                    created_by=admin,
                    updated_by=admin,
                )

        catalog = [
            ("LAB-CBC", "Complete Blood Count (CBC)", ItemType.LAB, "350.00"),
            ("LAB-LFT", "Liver Function Test", ItemType.LAB, "900.00"),
            ("LAB-RFT", "Renal Function Test", ItemType.LAB, "750.00"),
            ("OP-CONS", "OP Consultation", ItemType.OP, "500.00"),
            ("OP-REG", "Registration Fee", ItemType.OP, "100.00"),
            ("PHARM-PAR", "Paracetamol 500mg (10 tabs)", ItemType.PHARMACY, "25.00"),
        ]
        for code, name, item_type, rate in catalog:
            BillingItem.objects.get_or_create(
                branch=branch,
                code=code,
                defaults={
                    "name": name,
                    "item_type": item_type,
                    "default_rate": rate,
                    "created_by": admin,
                    "updated_by": admin,
                },
            )

        if Doctor.objects.count() < 5:
            specs = ["General Medicine", "Pathology", "Radiology", "Cardiology", "Orthopedics"]
            for i, spec in enumerate(specs):
                Doctor.objects.get_or_create(
                    name=f"Dr. Demo {i + 1}",
                    branch=branch,
                    defaults={
                        "specialization": spec,
                        "qualification": "MBBS",
                        "registration_number": f"REG{i + 1000}",
                        "phone": f"91{200000000 + i}",
                        "created_by": admin,
                        "updated_by": admin,
                    },
                )

        self.stdout.write(self.style.SUCCESS("Demo data seeded. Login: admin / adminpass123"))
