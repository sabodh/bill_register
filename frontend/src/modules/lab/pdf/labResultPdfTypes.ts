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
};

export type LabResultPdfSnapshot = {
  bill_number: string;
  hospital_name: string;
  doctor_name: string;
  sample_collected_at: string;
  sample_tested_at: string | null;
  reported_at: string;
  patient: LabResultPdfPatient;
  sections: LabResultPdfSection[];
};
