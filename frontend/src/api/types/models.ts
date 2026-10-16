export interface Branch {
  id: number;
  name: string;
  code: string;
}

export interface MeUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  branch: number | null;
  branch_detail: Branch | null;
  roles: string[];
  permissions: string[];
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface UserRecord {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  branch: number | null;
  is_active: boolean;
  role_ids: number[];
  role_names: string[];
}

export interface RoleRecord {
  id: number;
  name: string;
  permission_codenames: string[];
}

export interface Patient {
  id: number;
  uhid: string;
  name: string;
  gender: 'M' | 'F' | 'O';
  date_of_birth: string | null;
  age_years: number | null;
  phone: string;
  address: string;
  file_number: string;
  doctor: number | null;
  doctor_detail?: Doctor | null;
  op_token?: number | null;
  branch: number;
  is_active: boolean;
}

export interface DepartmentRecord {
  id: number;
  name: string;
  code: string;
  sort_order?: number;
  branch: number;
  is_active: boolean;
}

/** Reference-range / result-entry behaviour (form label: Test category). */
export type LabTestCategory = 'NORMAL' | 'SUBTEST' | 'SPECIAL' | 'MULTIPLE_REFERENCE';

/** @deprecated Use LabTestCategory */
export type LabTestType = LabTestCategory;

export type LabTestTypeTier =
  | 'TYPE_1'
  | 'TYPE_2'
  | 'TYPE_3'
  | 'TYPE_4'
  | 'TYPE_5'
  | 'TYPE_6'
  | 'TYPE_7'
  | 'TYPE_8'
  | 'TYPE_9'
  | 'TYPE_10';

export interface LabTestReferenceRange {
  id?: number;
  role?: 'SINGLE' | 'SUBTEST' | 'VARIANT';
  result_group?: string;
  reference_text: string;
  low_value: string | null;
  high_value: string | null;
  unit: string;
  sort_order?: number;
}

export type LabResultEntryLayout =
  | {
      layout: 'single';
      test_category: LabTestCategory;
      test_type?: LabTestTypeTier | null;
      title: string;
      method_name: string;
      result_key: string;
      unit: string;
      reference: string | null;
      reference_low?: string | null;
      reference_high?: string | null;
    }
  | {
      layout: 'panel';
      test_category: LabTestCategory;
      test_type?: LabTestTypeTier | null;
      title: string;
      method_name: string;
      panel_title: string;
      columns: { key: string; label: string; editable?: boolean }[];
      rows: {
        result_key: string;
        subtest_name: string;
        reference: string | null;
        reference_low?: string | null;
        reference_high?: string | null;
        unit: string;
      }[];
    }
  | {
      layout: 'multi_reference';
      test_category: LabTestCategory;
      test_type?: LabTestTypeTier | null;
      title: string;
      method_name: string;
      result_key: string;
      unit: string;
      variants: {
        label: string;
        reference: string | null;
        reference_low?: string | null;
        reference_high?: string | null;
        unit: string;
        display_text?: string;
      }[];
    }
  | {
      layout: 'billing_only';
      test_category: LabTestCategory;
      test_type?: LabTestTypeTier | null;
      title: string;
      method_name: string;
    };

export interface LabTestInterpretation {
  id?: number;
  note: string;
  sort_order?: number;
}

export interface LabPackageItemRecord {
  id: number;
  test: number;
  test_detail?: Pick<LabTestRecord, 'id' | 'name' | 'code' | 'default_rate'>;
  sort_order: number;
}

export interface LabPackageRecord {
  id: number;
  name: string;
  package_amount: string;
  items: LabPackageItemRecord[];
  branch: number;
  is_active: boolean;
}

export interface LabTestRecord {
  id: number;
  department: number | null;
  department_detail?: DepartmentRecord | null;
  name: string;
  code: string;
  method_name: string;
  test_category: LabTestCategory;
  test_type: LabTestTypeTier;
  default_rate: string;
  sort_order?: number;
  reference_ranges: LabTestReferenceRange[];
  interpretations: LabTestInterpretation[];
  result_entry_layout?: LabResultEntryLayout;
  branch: number;
  is_active: boolean;
}

export interface Doctor {
  id: number;
  department: number | null;
  department_detail?: DepartmentRecord | null;
  name: string;
  qualification: string;
  specialization: string;
  registration_number: string;
  phone: string;
  consultation_fee: string;
  revisit_period_days: number;
  is_referral: boolean;
  hospital_clinic_name: string;
  branch: number;
  is_active: boolean;
}

export type RegistrationKind = 'NEW_OP' | 'REVISIT';

/** Today's OP queue summary for registration desk (GET /doctors/op-tokens/). */
export interface DoctorOpTokenStat {
  id: number;
  name: string;
  specialization: string;
  /** Last token number issued today for this doctor. */
  current_token: number;
  /** Total admissions (registrations) today for this doctor. */
  admissions_today: number;
  new_op: number;
  revisit: number;
}

export interface RegistrationDeskSummary {
  total_registrations: number;
  new_op: number;
  revisit: number;
}

export interface RegistrationDeskOpTokens {
  summary: RegistrationDeskSummary;
  doctors: DoctorOpTokenStat[];
}

export interface PatientRevisitResult {
  patient: number;
  uhid: string;
  name: string;
  doctor: number;
  op_token: number;
  registration_kind: RegistrationKind;
}

export interface StaffMember {
  id: number;
  department: number | null;
  department_detail?: DepartmentRecord | null;
  user: number | null;
  username: string | null;
  employee_id: string;
  name: string;
  gender: 'M' | 'F' | 'O';
  date_of_birth: string | null;
  address: string;
  phone: string;
  alternative_phone: string;
  aadhar_number: string;
  designation: string;
  branch: number;
  is_active: boolean;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface BillingItem {
  id: number;
  code: string;
  name: string;
  item_type: string;
  default_rate: string;
  branch: number;
  is_active: boolean;
}

export interface BillLineRecord {
  id: number;
  billing_item: number | null;
  lab_test: number | null;
  lab_package: number | null;
  item_type: string;
  description: string;
  quantity: string;
  unit_price: string;
  amount: string;
  sort_order: number;
}

export interface BillRecord {
  id: number;
  bill_number: string;
  patient: number | null;
  status: string;
  total_amount: string;
  advance_paid: string;
  balance_due: string;
  sample_collected_at: string;
  sample_tested_at?: string | null;
  created_at: string;
}

export interface BillDetailRecord extends BillRecord {
  doctor: number | null;
  doctor_name: string;
  hospital: number | null;
  hospital_name: string;
  sample_tested_at: string | null;
  subtotal_amount: string;
  discount_type: 'NONE' | 'PERCENT' | 'AMOUNT';
  discount_percent: string;
  discount_amount: string;
  discount_applied: string;
  payment_method: 'CASH' | 'UPI' | 'CARD' | 'CREDIT';
  payment_transaction_id: string;
  notes: string;
  lines: BillLineRecord[];
  patient_detail: Patient | null;
}

export interface LabResultBillSummary {
  id: number;
  bill_number: string;
  patient: number;
  patient_name: string;
  patient_uhid: string;
  sample_collected_at: string;
  doctor_name: string;
  hospital_name: string;
  total_amount: string;
  advance_paid: string;
  balance_due: string;
  work_item_count: number;
  billing_completed: boolean;
  results_completed: boolean;
  result_slots_filled: number;
  result_slots_total: number;
  created_at: string;
}

export interface LabSavedResult {
  bill_line_id: number;
  lab_test_id: number;
  result_key: string;
  value: string;
}

export interface LabResultWorkItem {
  bill_line_id: number;
  lab_test_id: number;
  test_name: string;
  test_code: string;
  method_name: string;
  department_name: string;
  test_category: LabTestCategory;
  test_type: LabTestTypeTier;
  from_package: boolean;
  package_name: string | null;
  result_entry_layout: LabResultEntryLayout;
  /** Master test interpretation notes (read-only reference for this result). */
  default_notes: string[];
}

export interface LabResultBillDetail {
  id: number;
  bill_number: string;
  patient: number;
  patient_detail: {
    id: number;
    uhid: string;
    name: string;
    gender: string;
    age_years: number | null;
    phone: string;
  } | null;
  doctor: number | null;
  doctor_name: string;
  hospital: number | null;
  hospital_name: string;
  /** Relative media URL for hospital/branch letterhead image, when configured. */
  letterhead_image_url?: string | null;
  sample_collected_at: string;
  sample_tested_at: string | null;
  total_amount: string;
  notes: string;
  work_items: LabResultWorkItem[];
  saved_results: LabSavedResult[];
  created_at: string;
}
