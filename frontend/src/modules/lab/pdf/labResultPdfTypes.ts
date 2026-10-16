export type LabResultPdfRow = {
  name: string;
  result: string;
  reference: string;
  unit: string;
  isSubtest?: boolean;
};

export type LabResultPdfTest = {
  title: string;
  testCode: string;
  methodName: string;
  isPanel: boolean;
  rows: LabResultPdfRow[];
  interpretation: string;
};

export type LabResultPdfSection = {
  departmentName: string;
  tests: LabResultPdfTest[];
};

export type LabResultPdfPatient = {
  name: string;
  uhid: string;
  phone: string;
  ageSex: string;
  age_years: number | null;
  gender: 'M' | 'F' | 'O';
};

export type LabResultPdfSnapshot = {
  bill_number: string;
  /** Absolute or site-relative URL for branch letterhead image. */
  letterhead_image_url: string | null;
  hospital_name: string;
  doctor_name: string;
  sample_collected_at: string;
  sample_tested_at: string | null;
  reported_at: string;
  patient: LabResultPdfPatient;
  sections: LabResultPdfSection[];
};
