from django.db.models.signals import pre_save
from django.dispatch import receiver

from apps.core.models import Doctor, Patient, Staff


@receiver(pre_save, sender=Patient)
@receiver(pre_save, sender=Doctor)
@receiver(pre_save, sender=Staff)
def set_audit_user(sender, instance, **kwargs):
    # Viewsets set created_by/updated_by explicitly; signal is a fallback for admin/shell.
    pass
