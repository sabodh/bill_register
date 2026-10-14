import pytest

from apps.billing.models import BillingItem, ItemType


@pytest.mark.django_db
def test_create_bill_rejects_duplicate_billing_items(auth_client, branch):
    item = BillingItem.objects.create(
        branch=branch,
        code="CBC",
        name="Complete Blood Count",
        item_type=ItemType.LAB,
        default_rate="500.00",
    )
    payload = {
        "lines": [
            {
                "billing_item": item.id,
                "description": item.name,
                "quantity": "1",
                "unit_price": "500.00",
            },
            {
                "billing_item": item.id,
                "description": item.name,
                "quantity": "1",
                "unit_price": "500.00",
            },
        ],
    }
    response = auth_client.post("/api/billing/bills/", payload, format="json")
    assert response.status_code == 400
    assert "lines" in response.data
