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
  branch: number;
  is_active: boolean;
}

export interface LabTestRecord {
  id: number;
  department: number | null;
  department_detail?: DepartmentRecord | null;
  name: string;
  code: string;
  default_rate: string;
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
