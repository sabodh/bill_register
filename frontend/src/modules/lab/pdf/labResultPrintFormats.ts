import {
  DEFAULT_LAB_RESULT_PDF_RENDER_OPTIONS,
  type LabResultPdfRenderOptions,
} from './labResultPdfRender';

const STORAGE_KEY = 'lab.resultPrintFormatId';

export type LabResultPrintFormatId = string;

export type LabResultPrintFormatTemplate = 'standard' | 'panel-report';

export type LabResultPrintFormat = {
  id: LabResultPrintFormatId;
  label: string;
  description: string;
  template: LabResultPrintFormatTemplate;
  renderOptions: LabResultPdfRenderOptions;
};

function defineFormat(
  id: LabResultPrintFormatId,
  label: string,
  description: string,
  template: LabResultPrintFormatTemplate,
  overrides: Partial<LabResultPdfRenderOptions> = {},
): LabResultPrintFormat {
  return {
    id,
    label,
    description,
    template,
    renderOptions: { ...DEFAULT_LAB_RESULT_PDF_RENDER_OPTIONS, ...overrides },
  };
}

/** Add new entries here to expose more result report layouts in the UI. */
export const LAB_RESULT_PRINT_FORMATS: LabResultPrintFormat[] = [
  defineFormat(
    'standard',
    'Standard A4',
    'Letterhead image, patient block, department headings, method lines, and sign-off.',
    'standard',
    {
      departmentHeadingShaded: false,
      includeSpaceBeforeDepartment: false,
      spaciousDepartmentHeading: true,
    },
  ),
  defineFormat(
    'letterpad',
    'Pre-printed letterpad',
    'Hides the digital letterhead image but keeps the top blank band for pre-printed stationery.',
    'standard',
    {
      includeLetterhead: false,
      includeSpaceBeforeDepartment: false,
      tightDepartmentTopSpacing: true,
    },
  ),
  defineFormat(
    'letterpad-plain',
    'Pre-printed letterpad (plain)',
    'Letterpad without digital header image; no divider lines and plain department headings.',
    'standard',
    {
      includeLetterhead: false,
      includeReportDividers: false,
      departmentHeadingShaded: false,
      includeSpaceBeforeDepartment: false,
      spaciousDepartmentHeading: true,
    },
  ),
  defineFormat(
    'compact',
    'Compact',
    'Same patient header; omits department headings and per-test method lines for a shorter body.',
    'standard',
    {
      includeDepartmentHeadings: false,
      includeMethodLines: false,
    },
  ),
  defineFormat(
    'panel-report',
    'Panel report (detailed)',
    'TEST / VALUE / UNIT / REFERENCE table, narrative notes, patient details at the end — like sample panel reports.',
    'panel-report',
    {
      includeLetterhead: false,
      includeHospitalName: true,
      includeMethodLines: false,
      includeDepartmentHeadings: true,
      includeInterpretation: true,
    },
  ),
];

export const DEFAULT_LAB_RESULT_PRINT_FORMAT_ID: LabResultPrintFormatId = 'standard';

export function getLabResultPrintFormat(id: LabResultPrintFormatId): LabResultPrintFormat {
  return (
    LAB_RESULT_PRINT_FORMATS.find((format) => format.id === id) ??
    LAB_RESULT_PRINT_FORMATS.find((format) => format.id === DEFAULT_LAB_RESULT_PRINT_FORMAT_ID)!
  );
}

export function getStoredLabResultPrintFormatId(): LabResultPrintFormatId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && LAB_RESULT_PRINT_FORMATS.some((format) => format.id === stored)) {
      return stored;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_LAB_RESULT_PRINT_FORMAT_ID;
}

export function setStoredLabResultPrintFormatId(id: LabResultPrintFormatId): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}
