/** Built-in PDF fonts (no extra files). Custom TTF can be added later via `Font.register`. */
export type LabResultPdfFontPreset = 'helvetica' | 'times' | 'courier';

export type LabResultPdfFontFamilies = {
  regular: string;
  bold: string;
};

const PRESETS: Record<LabResultPdfFontPreset, { label: string; families: LabResultPdfFontFamilies }> = {
  helvetica: {
    label: 'Helvetica (sans)',
    families: { regular: 'Helvetica', bold: 'Helvetica-Bold' },
  },
  times: {
    label: 'Times (serif)',
    families: { regular: 'Times-Roman', bold: 'Times-Bold' },
  },
  courier: {
    label: 'Courier (mono)',
    families: { regular: 'Courier', bold: 'Courier-Bold' },
  },
};

export const LAB_RESULT_PDF_FONT_PRESETS = (
  Object.entries(PRESETS) as [LabResultPdfFontPreset, (typeof PRESETS)[LabResultPdfFontPreset]][]
).map(([id, value]) => ({ id, label: value.label }));

export function labResultPdfFontFamilies(preset: LabResultPdfFontPreset): LabResultPdfFontFamilies {
  return PRESETS[preset]?.families ?? PRESETS.helvetica.families;
}

export function labResultPdfFontPresetLabel(preset: LabResultPdfFontPreset): string {
  return PRESETS[preset]?.label ?? PRESETS.helvetica.label;
}
