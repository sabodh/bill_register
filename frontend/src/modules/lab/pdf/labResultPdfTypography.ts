import type { LabResultPrintFormatTemplate } from './labResultPrintFormats';

/** Point sizes for each text role in result PDFs (standard + panel templates). */
export type LabResultPdfTypographyRole =
  | 'body'
  | 'patient'
  | 'department'
  | 'testName'
  | 'result'
  | 'method'
  | 'reference'
  | 'tableHeader'
  | 'interpretation'
  | 'signOff'
  | 'footer';

export type LabResultPdfTypography = Record<LabResultPdfTypographyRole, number>;

export type LabResultPdfTypographySize = 'compact' | 'normal' | 'large';

export const LAB_RESULT_PDF_TYPOGRAPHY_SIZE_OPTIONS: {
  value: LabResultPdfTypographySize;
  label: string;
  scale: number;
}[] = [
  { value: 'compact', label: 'Compact', scale: 0.92 },
  { value: 'normal', label: 'Normal', scale: 1 },
  { value: 'large', label: 'Large', scale: 1.08 },
];

export const LAB_RESULT_PDF_TYPOGRAPHY_ROLE_LABELS: Record<LabResultPdfTypographyRole, string> = {
  body: 'Default body',
  patient: 'Patient header',
  department: 'Department heading',
  testName: 'Test / panel name',
  result: 'Result value',
  method: 'Method line',
  reference: 'Reference range',
  tableHeader: 'Column headers',
  interpretation: 'Interpretation',
  signOff: 'Sign-off lines',
  footer: 'Footer note',
};

/** Roles shown in the preview “fine-tune” grid (most commonly adjusted). */
export const LAB_RESULT_PDF_TYPOGRAPHY_TUNABLE_ROLES: LabResultPdfTypographyRole[] = [
  'patient',
  'department',
  'testName',
  'result',
  'method',
  'reference',
  'tableHeader',
  'interpretation',
];

const STANDARD_BASE: LabResultPdfTypography = {
  body: 10,
  patient: 9,
  department: 11,
  testName: 10,
  result: 10,
  method: 9,
  reference: 9,
  tableHeader: 9,
  interpretation: 9,
  signOff: 9,
  footer: 8,
};

const PANEL_BASE: LabResultPdfTypography = {
  body: 9,
  patient: 9,
  department: 11,
  testName: 10,
  result: 9,
  method: 8.5,
  reference: 8,
  tableHeader: 9,
  interpretation: 8.5,
  signOff: 9,
  footer: 8,
};

function baseTypography(template: LabResultPrintFormatTemplate): LabResultPdfTypography {
  return template === 'panel-report' ? { ...PANEL_BASE } : { ...STANDARD_BASE };
}

function scaleTypography(base: LabResultPdfTypography, scale: number): LabResultPdfTypography {
  const out = { ...base };
  for (const role of Object.keys(out) as LabResultPdfTypographyRole[]) {
    out[role] = roundPt(out[role] * scale);
  }
  return out;
}

function roundPt(value: number): number {
  return Math.round(value * 2) / 2;
}

export function typographyScaleForSize(size: LabResultPdfTypographySize): number {
  return (
    LAB_RESULT_PDF_TYPOGRAPHY_SIZE_OPTIONS.find((option) => option.value === size)?.scale ?? 1
  );
}

export function resolveLabResultPdfTypography(
  template: LabResultPrintFormatTemplate,
  typographySize: LabResultPdfTypographySize,
  fontSizesPt?: Partial<LabResultPdfTypography>,
): LabResultPdfTypography {
  const scaled = scaleTypography(baseTypography(template), typographyScaleForSize(typographySize));
  if (!fontSizesPt) {
    return scaled;
  }
  return { ...scaled, ...fontSizesPt };
}

export function defaultTypographyPt(
  template: LabResultPrintFormatTemplate,
  role: LabResultPdfTypographyRole,
  typographySize: LabResultPdfTypographySize,
): number {
  return resolveLabResultPdfTypography(template, typographySize)[role];
}
