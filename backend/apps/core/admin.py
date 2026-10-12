from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from apps.core.models import Branch, Doctor, Patient, Staff, User, Visit


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    fieldsets = DjangoUserAdmin.fieldsets + (
        ("Profile", {"fields": ("phone", "branch")}),
    )
    list_display = ["username", "email", "branch", "is_active", "is_staff"]


admin.site.register(Branch)
admin.site.register(Patient)
admin.site.register(Doctor)
admin.site.register(Staff)
admin.site.register(Visit)
