"""Granular permission codenames used across modules (Django auth.Permission)."""

# Core / registration
CORE_VIEW_BRANCH = "core.view_branch"
CORE_ADD_BRANCH = "core.add_branch"
CORE_CHANGE_BRANCH = "core.change_branch"

CORE_VIEW_PATIENT = "core.view_patient"
CORE_ADD_PATIENT = "core.add_patient"
CORE_CHANGE_PATIENT = "core.change_patient"

CORE_VIEW_DOCTOR = "core.view_doctor"
CORE_ADD_DOCTOR = "core.add_doctor"
CORE_CHANGE_DOCTOR = "core.change_doctor"

CORE_VIEW_STAFF = "core.view_staff"
CORE_ADD_STAFF = "core.add_staff"
CORE_CHANGE_STAFF = "core.change_staff"

CORE_VIEW_USER = "core.view_user"
CORE_ADD_USER = "core.add_user"
CORE_CHANGE_USER = "core.change_user"

CORE_VIEW_ROLE = "core.view_role"
CORE_MANAGE_ROLE = "core.manage_role"

CORE_VIEW_ALL_BRANCHES = "core.view_all_branches"

# Future modules (menu + API placeholders)
LAB_VIEW_TEST = "lab.view_test"
LAB_ADD_ORDER = "lab.add_order"

BILLING_VIEW_BILL = "billing.view_bill"
BILLING_ADD_BILL = "billing.add_bill"

PHARMACY_VIEW_PRESCRIPTION = "pharmacy.view_prescription"
PHARMACY_DISPENSE = "pharmacy.dispense"

CLINICAL_VIEW_FACESHEET = "clinical.view_facesheet"
CLINICAL_VIEW_OP = "clinical.view_op"

REPORTS_VIEW = "reports.view_report"

DASHBOARD_VIEW = "dashboard.view_dashboard"

# Maps Django model permissions to our custom codenames where needed
DEFAULT_ROLE_PERMISSIONS: dict[str, list[str]] = {
    "Admin": [
        CORE_VIEW_BRANCH,
        CORE_ADD_BRANCH,
        CORE_CHANGE_BRANCH,
        CORE_VIEW_PATIENT,
        CORE_ADD_PATIENT,
        CORE_CHANGE_PATIENT,
        CORE_VIEW_DOCTOR,
        CORE_ADD_DOCTOR,
        CORE_CHANGE_DOCTOR,
        CORE_VIEW_STAFF,
        CORE_ADD_STAFF,
        CORE_CHANGE_STAFF,
        CORE_VIEW_USER,
        CORE_ADD_USER,
        CORE_CHANGE_USER,
        CORE_VIEW_ROLE,
        CORE_MANAGE_ROLE,
        CORE_VIEW_ALL_BRANCHES,
        LAB_VIEW_TEST,
        LAB_ADD_ORDER,
        BILLING_VIEW_BILL,
        BILLING_ADD_BILL,
        PHARMACY_VIEW_PRESCRIPTION,
        PHARMACY_DISPENSE,
        CLINICAL_VIEW_FACESHEET,
        CLINICAL_VIEW_OP,
        REPORTS_VIEW,
        DASHBOARD_VIEW,
    ],
    "Receptionist": [
        DASHBOARD_VIEW,
        CORE_VIEW_PATIENT,
        CORE_ADD_PATIENT,
        CORE_CHANGE_PATIENT,
        CORE_VIEW_DOCTOR,
        CORE_VIEW_STAFF,
        BILLING_VIEW_BILL,
        BILLING_ADD_BILL,
    ],
    "Lab Technician": [
        DASHBOARD_VIEW,
        CORE_VIEW_PATIENT,
        LAB_VIEW_TEST,
        LAB_ADD_ORDER,
    ],
    "Pathologist": [
        DASHBOARD_VIEW,
        CORE_VIEW_PATIENT,
        LAB_VIEW_TEST,
    ],
    "Billing": [
        DASHBOARD_VIEW,
        CORE_VIEW_PATIENT,
        BILLING_VIEW_BILL,
        BILLING_ADD_BILL,
    ],
}
