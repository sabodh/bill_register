import type { LabResultPdfFontPreset } from './labResultPdfFonts';
import { LAB_RESULT_PDF_FONT_PRESETS } from './labResultPdfFonts';
import {
  getLabResultPrintFormat,
  type LabResultPrintFormatId,
} from './labResultPrintFormats';
import {
  normalizeLabResultPdfRenderOptions,
  type LabResultPdfRenderOptions,
} from './labResultPdfRender';
import type {
  LabResultPdfTypography,
  LabResultPdfTypographyRole,
  LabResultPdfTypographySize,
} from './labResultPdfTypography';
import { LAB_RESULT_PDF_TYPOGRAPHY_SIZE_OPTIONS } from './labResultPdfTypography';

const STORAGE_KEY = 'lab.resultPdfPreferences';

const TYPOGRAPHY_ROLES: LabResultPdfTypographyRole[] = [
  'body',
  'patient',
  'department',
  'testName',
  'result',
  'method',
  'reference',
  'tableHeader',
  'interpretation',
  'signOff',
  'footer',
];

/** Layout toggles from the preview options bar — saved per browser. */
export const LAB_RESULT_PDF_LAYOUT_PREFERENCE_KEYS = [
  'includeLetterhead',
  'includeHospitalName',
  'includeSampleCollectionTime',
  'includeDepartmentHeadings',
  'includeMethodLines',
  'omitTestsWithoutResults',
  'includeAuthorizedSignature',
  'includePathologistDesignation',
  'includeInterpretation',
] as const satisfies readonly (keyof LabResultPdfRenderOptions)[];

export type LabResultPdfLayoutPreferenceKey = (typeof LAB_RESULT_PDF_LAYOUT_PREFERENCE_KEYS)[number];

const FONT_PRESET_IDS = new Set(LAB_RESULT_PDF_FONT_PRESETS.map((preset) => preset.id));
const TYPOGRAPHY_SIZE_VALUES = new Set(
  LAB_RESULT_PDF_TYPOGRAPHY_SIZE_OPTIONS.map((option) => option.value),
);

/** Font, sizes, and layout toggles remembered in this browser (localStorage). */
export type LabResultPdfStoredPreferences = {
  fontPreset?: LabResultPdfFontPreset;
  typographySize?: LabResultPdfTypographySize;
  fontSizesPt?: Partial<LabResultPdfTypography>;
} & Partial<Pick<LabResultPdfRenderOptions, LabResultPdfLayoutPreferenceKey>>;

function sanitizeFontSizesPt(
  raw: unknown,
): Partial<LabResultPdfTypography> | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }
  const out: Partial<LabResultPdfTypography> = {};
  for (const role of TYPOGRAPHY_ROLES) {
    const value = (raw as Record<string, unknown>)[role];
    if (typeof value === 'number' && Number.isFinite(value) && value >= 6 && value <= 16) {
      out[role] = value;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function sanitizeLayoutPreferences(
  raw: Record<string, unknown>,
): Partial<Pick<LabResultPdfRenderOptions, LabResultPdfLayoutPreferenceKey>> {
  const out: Partial<Pick<LabResultPdfRenderOptions, LabResultPdfLayoutPreferenceKey>> = {};
  for (const key of LAB_RESULT_PDF_LAYOUT_PREFERENCE_KEYS) {
    const value = raw[key];
    if (typeof value === 'boolean') {
      out[key] = value;
    }
  }
  return out;
}

function sanitizePreferences(raw: unknown): LabResultPdfStoredPreferences | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const input = raw as Record<string, unknown>;
  const out: LabResultPdfStoredPreferences = {};

  const fontPreset = input.fontPreset;
  if (typeof fontPreset === 'string' && FONT_PRESET_IDS.has(fontPreset as LabResultPdfFontPreset)) {
    out.fontPreset = fontPreset as LabResultPdfFontPreset;
  }
  const typographySize = input.typographySize;
  if (
    typeof typographySize === 'string' &&
    TYPOGRAPHY_SIZE_VALUES.has(typographySize as LabResultPdfTypographySize)
  ) {
    out.typographySize = typographySize as LabResultPdfTypographySize;
  }
  const fontSizesPt = sanitizeFontSizesPt(input.fontSizesPt);
  if (fontSizesPt) {
    out.fontSizesPt = fontSizesPt;
  }

  Object.assign(out, sanitizeLayoutPreferences(input));

  return Object.keys(out).length > 0 ? out : null;
}

export function getStoredLabResultPdfPreferences(): LabResultPdfStoredPreferences | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return sanitizePreferences(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function setStoredLabResultPdfPreferences(prefs: LabResultPdfStoredPreferences): void {
  const sanitized = sanitizePreferences(prefs);
  try {
    if (!sanitized) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  } catch {
    /* ignore */
  }
}

function layoutPreferencesFromRenderOptions(
  options: LabResultPdfRenderOptions,
): Partial<Pick<LabResultPdfRenderOptions, LabResultPdfLayoutPreferenceKey>> {
  const out: Partial<Pick<LabResultPdfRenderOptions, LabResultPdfLayoutPreferenceKey>> = {};
  for (const key of LAB_RESULT_PDF_LAYOUT_PREFERENCE_KEYS) {
    out[key] = options[key];
  }
  return out;
}

/**
 * Print format defaults, then saved font / typography / layout from this browser.
 * Default print format id remains in `lab.resultPrintFormatId` (Set as default).
 */
export function labResultPdfRenderOptionsForFormat(
  formatId: LabResultPrintFormatId,
): LabResultPdfRenderOptions {
  const format = getLabResultPrintFormat(formatId);
  const stored = getStoredLabResultPdfPreferences();
  return normalizeLabResultPdfRenderOptions({
    ...format.renderOptions,
    ...stored,
  });
}

export function persistLabResultPdfPreferencesFromRenderOptions(
  options: LabResultPdfRenderOptions,
): void {
  setStoredLabResultPdfPreferences({
    fontPreset: options.fontPreset,
    typographySize: options.typographySize,
    fontSizesPt: options.fontSizesPt,
    ...layoutPreferencesFromRenderOptions(options),
  });
}
