import pytest

from apps.lab.models import LabTest, LabTestReferenceRange, TestDepartment, TestType
from apps.lab.services.result_template import build_result_entry_layout


@pytest.mark.django_db
def test_subtest_panel_layout(branch):
    dept = TestDepartment.objects.create(branch=branch, name="Hematology")
    test = LabTest.objects.create(
        branch=branch,
        department=dept,
        name="DIFFERENTIAL LEUKOCYTE COUNT (DC)",
        test_type=TestType.SUBTEST,
        default_rate="100",
    )
    LabTestReferenceRange.objects.create(
        test=test,
        reference_text="Neutrophils",
        low_value="40",
        high_value="70",
        unit="%",
        sort_order=0,
    )
    layout = build_result_entry_layout(test)
    assert layout["layout"] == "panel"
    assert len(layout["rows"]) == 1
    assert layout["rows"][0]["subtest_name"] == "Neutrophils"
    assert layout["rows"][0]["reference"] == "40 – 70"
