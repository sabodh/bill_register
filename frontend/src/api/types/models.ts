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
  branch: number;
  is_active: boolean;
}

export interface Doctor {
  id: number;
  name: string;
  qualification: string;
  specialization: string;
  registration_number: string;
  phone: string;
  consultation_fee: string;
  is_referral: boolean;
  hospital_clinic_name: string;
  branch: number;
  is_active: boolean;
}

export interface StaffMember {
  id: number;
  user: number | null;
  username: string | null;
  employee_id: string;
  designation: string;
  phone: string;
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
