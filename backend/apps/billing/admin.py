from django.contrib import admin

from apps.billing.models import Bill, BillLine, BillingItem


class BillLineInline(admin.TabularInline):
    model = BillLine
    extra = 0


@admin.register(BillingItem)
class BillingItemAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "item_type", "default_rate", "branch", "is_active"]
    search_fields = ["name", "code"]


@admin.register(Bill)
class BillAdmin(admin.ModelAdmin):
    list_display = ["bill_number", "patient", "total_amount", "status", "branch"]
    inlines = [BillLineInline]
