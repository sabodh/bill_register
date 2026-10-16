import type { LabResultPdfFontPreset } from './labResultPdfFonts';
import type {
  LabResultPdfTypography,
  LabResultPdfTypographySize,
} from './labResultPdfTypography';
import type { LabResultPdfRow, LabResultPdfSection, LabResultPdfSnapshot, LabResultPdfTest } from './labResultPdfTypes';

/** Toggles for result report PDF preview, print, and download. */
export type LabResultPdfRenderOptions = {
  /** Show letterhead image when available; when off, keeps blank letterpad space (patient details unchanged). */
  includeLetterhead: boolean;
  includeHospitalName: boolean;
  includeSampleCollectionTime: boolean;
  includeDepartmentHeadings: boolean;
  includeMethodLines: boolean;
  omitTestsWithoutResults: boolean;
  /** “Authorized signatory: ___” line. */
  includeAuthorizedSignature: boolean;
  /** “Designation: Pathologist / Lab director” line. */
  includePathologistDesignation: boolean;
  /** Per-test “Note: …” interpretation lines. */
  includeInterpretation: boolean;
  includeFooterDisclaimer: boolean;
  /** Horizontal rules between patient block, column header, and result rows. */
  includeReportDividers: boolean;
  /** Grey band behind department headings (standard template). */
  departmentHeadingShaded: boolean;
  /** Extra gap between the test-name header rule and the first department heading. */
  includeSpaceBeforeDepartment: boolean;
  /** Less space above department headings (pre-printed letterpad). */
  tightDepartmentTopSpacing: boolean;
  /** Standard A4 / letterpad (plain): comfortable top/bottom padding on department title text. */
  spaciousDepartmentHeading: boolean;
  fontPreset: LabResultPdfFontPreset;
  /** Scales all section font sizes for this report. */
  typographySize: LabResultPdfTypographySize;
  /** Optional absolute overrides (pt) per section; wins over overall scale. */
  fontSizesPt?: Partial<LabResultPdfTypography>;
};

export const DEFAULT_LAB_RESULT_PDF_RENDER_OPTIONS: LabResultPdfRenderOptions = {
  includeLetterhead: true,
  includeHospitalName: true,
  includeSampleCollectionTime: true,
  includeDepartmentHeadings: true,
  includeMethodLines: true,
  omitTestsWithoutResults: true,
  includeAuthorizedSignature: true,
  includePathologistDesignation: true,
  includeInterpretation: true,
  includeFooterDisclaimer: true,
  includeReportDividers: true,
  departmentHeadingShaded: true,
  includeSpaceBeforeDepartment: false,
  tightDepartmentTopSpacing: false,
  spaciousDepartmentHeading: false,
  fontPreset: 'helvetica',
  typographySize: 'normal',
};

function rowHasResult(row: LabResultPdfRow): boolean {
  return (row.result ?? '').trim().length > 0;
}

function filterTest(test: LabResultPdfTest, omitEmpty: boolean): LabResultPdfTest | null {
  if (!omitEmpty) {
    return test;
  }
  if (test.isPanel) {
    const rows = test.rows.filter(rowHasResult);
    if (rows.length === 0) {
      return null;
    }
    return { ...test, rows };
  }
  if (!test.rows.some(rowHasResult)) {
    return null;
  }
  return test;
}

function filterSections(sections: LabResultPdfSection[], omitEmpty: boolean): LabResultPdfSection[] {
  if (!omitEmpty) {
    return sections;
  }
  return sections
    .map((section) => ({
      ...section,
      tests: section.tests
        .map((test) => filterTest(test, true))
        .filter((test): test is LabResultPdfTest => test != null),
    }))
    .filter((section) => section.tests.length > 0);
}

export function labResultPdfSnapshotForRender(
  snapshot: LabResultPdfSnapshot,
  options: LabResultPdfRenderOptions,
): LabResultPdfSnapshot {
  if (!options.omitTestsWithoutResults) {
    return snapshot;
  }
  return {
    ...snapshot,
    sections: filterSections(snapshot.sections, true),
  };
}

export function normalizeLabResultPdfRenderOptions(
  options?: Partial<LabResultPdfRenderOptions>,
): LabResultPdfRenderOptions {
  const { fontSizesPt, ...rest } = options ?? {};
  const merged: LabResultPdfRenderOptions = {
    ...DEFAULT_LAB_RESULT_PDF_RENDER_OPTIONS,
    ...rest,
  };
  if (fontSizesPt && Object.keys(fontSizesPt).length > 0) {
    merged.fontSizesPt = { ...fontSizesPt };
  } else {
    delete merged.fontSizesPt;
  }
  return merged;
}

export function labResultPdfOptionsKey(options: LabResultPdfRenderOptions): string {
  return JSON.stringify(options);
}
