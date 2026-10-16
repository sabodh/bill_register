import { DEFAULT_LAB_REPORT_LETTERHEAD_URL } from './defaultLabLetterhead';
import type { LabResultPdfSnapshot } from './labResultPdfTypes';

/** Static bill used for format previews on the Result print formats page. */
export const LAB_RESULT_PRINT_FORMAT_SAMPLE_SNAPSHOT: LabResultPdfSnapshot = {
  bill_number: 'BILL-SAMPLE',
  letterhead_image_url: DEFAULT_LAB_REPORT_LETTERHEAD_URL,
  hospital_name: 'Sample Hospital',
  doctor_name: 'Arjun',
  sample_collected_at: '2026-10-14T10:48:00.000Z',
  sample_tested_at: '2026-10-16T07:01:00.000Z',
  reported_at: '2026-10-16T07:01:00.000Z',
  patient: {
    name: 'John Doe',
    uhid: 'UHID-001',
    phone: '9876543210',
    ageSex: '45 / M',
    age_years: 45,
    gender: 'M',
  },
  sections: [
    {
      departmentName: 'Biochemistry',
      tests: [
        {
          title: 'Bilirubin total, direct & indirect',
          testCode: 'BIL-TDI',
          methodName: 'Diazo',
          isPanel: true,
          interpretation:
            'Physiological basis\nBilirubin is the orange-yellow pigment derived from the breakdown of hemoglobin. The majority comes from senescent red cells.\n\nComments\nAssay of total bilirubin includes conjugated (direct) and unconjugated (indirect) bilirubin.',
          rows: [
            {
              name: 'Serum bilirubin (total)',
              result: '1.1',
              reference: '0.2 - 1.2',
              unit: 'mg/dl',
              isSubtest: true,
            },
            {
              name: 'Serum bilirubin (direct)',
              result: '0.2',
              reference: '0 - 0.3',
              unit: 'mg/dl',
              isSubtest: true,
            },
            {
              name: 'Serum bilirubin (indirect)',
              result: '0.90',
              reference: '0.2 - 1',
              unit: 'mg/dl',
              isSubtest: true,
            },
          ],
        },
      ],
    },
  ],
};
