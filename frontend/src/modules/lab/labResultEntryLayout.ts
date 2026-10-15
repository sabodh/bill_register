import type { LabResultEntryLayout, LabTestCategory } from '../../api/types/models';
import { formatVariantDisplayText } from './labVariantDisplay';

export function formatRef(low?: string | null, high?: string | null) {
  if (low && high) {
    return `${low} – ${high}`;
  }
  return low || high || '—';
}

export type DraftRange = {
  reference_text?: string;
  low_value?: number | null;
  high_value?: number | null;
  unit?: string;
};

export function resolveResultEntryLayout(
  layout: LabResultEntryLayout | null | undefined,
  testCategory: LabTestCategory,
  title: string,
  methodName: string,
  draftRanges: DraftRange[],
): LabResultEntryLayout {
  if (layout) {
    return layout;
  }

  const dec = (n: number | null | undefined) =>
    n == null || Number.isNaN(n) ? null : String(n);

  if (testCategory === 'SUBTEST') {
    return {
      layout: 'panel',
      test_category: testCategory,
      title,
      method_name: methodName,
      panel_title: title,
      columns: [
        { key: 'subtest_name', label: 'Subtest names' },
        { key: 'result', label: 'Result', editable: true },
        { key: 'reference', label: 'Biological reference range (min–max)' },
        { key: 'unit', label: 'Unit' },
      ],
      rows: draftRanges.map((row, index) => ({
        result_key: `draft-${index}`,
        subtest_name: row.reference_text || `Line ${index + 1}`,
        reference: formatRef(dec(row.low_value), dec(row.high_value)),
        reference_low: dec(row.low_value),
        reference_high: dec(row.high_value),
        unit: row.unit || '',
      })),
    };
  }

  if (testCategory === 'SPECIAL') {
    return {
      layout: 'billing_only',
      test_category: testCategory,
      title,
      method_name: methodName,
    };
  }

  if (testCategory === 'MULTIPLE_REFERENCE') {
    const unit = draftRanges[0]?.unit || '';
    return {
      layout: 'multi_reference',
      test_category: testCategory,
      title,
      method_name: methodName,
      result_key: 'main',
      unit,
      variants: draftRanges.map((row, index) => {
        const label = row.reference_text || `Range ${index + 1}`;
        const low = dec(row.low_value);
        const high = dec(row.high_value);
        const rowUnit = row.unit || unit;
        return {
          label,
          reference: formatRef(low, high),
          reference_low: low,
          reference_high: high,
          unit: rowUnit,
          display_text: formatVariantDisplayText(label, low, high, rowUnit),
        };
      }),
    };
  }

  const row = draftRanges[0];
  return {
    layout: 'single',
    test_category: testCategory,
    title,
    method_name: methodName,
    result_key: 'main',
    unit: row?.unit || '',
    reference: row ? formatRef(dec(row.low_value), dec(row.high_value)) : null,
    reference_low: dec(row?.low_value),
    reference_high: dec(row?.high_value),
  };
}
