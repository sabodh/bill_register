import json
from typing import Any

from django.forms.models import model_to_dict

from apps.core.models.audit import AuditLog


def _serialize_value(value: Any) -> Any:
    if hasattr(value, "pk"):
        return value.pk
    if isinstance(value, (str, int, float, bool, type(None))):
        return value
    return str(value)


def snapshot_instance(instance: Any) -> dict[str, Any]:
    data = model_to_dict(instance)
    return {k: _serialize_value(v) for k, v in data.items()}


class AuditLogMixin:
    audit_log_fields: str | None = None

    def perform_create(self, serializer: Any) -> None:
        super().perform_create(serializer)
        self._log_audit("create", serializer.instance, {})

    def perform_update(self, serializer: Any) -> None:
        before = snapshot_instance(serializer.instance)
        super().perform_update(serializer)
        serializer.instance.refresh_from_db()
        after = snapshot_instance(serializer.instance)
        changes = {
            k: {"from": before.get(k), "to": after.get(k)}
            for k in after
            if before.get(k) != after.get(k)
        }
        self._log_audit("update", serializer.instance, changes)

    def perform_destroy(self, instance: Any) -> None:
        self._log_audit("delete", instance, snapshot_instance(instance))
        super().perform_destroy(instance)

    def _log_audit(self, action: str, instance: Any, changes: dict[str, Any]) -> None:
        user = self.request.user if self.request.user.is_authenticated else None
        AuditLog.objects.create(
            user=user,
            action=action,
            model=instance.__class__.__name__,
            object_id=str(instance.pk),
            changes=changes if isinstance(changes, dict) else json.loads(json.dumps(changes, default=str)),
        )
