import type { LabTestTypeTier } from '../../api/types/models';

export function formatLabTestTypeTier(code: string | null | undefined): string {
  if (!code) {
    return 'Type-1';
  }
  const match = /^TYPE_(\d+)$/.exec(code);
  if (match) {
    return `Type-${match[1]}`;
  }
  return code;
}

export const LAB_TEST_TYPE_TIER_OPTIONS: { value: LabTestTypeTier; label: string }[] = [
  'TYPE_1',
  'TYPE_2',
  'TYPE_3',
  'TYPE_4',
  'TYPE_5',
  'TYPE_6',
  'TYPE_7',
  'TYPE_8',
  'TYPE_9',
  'TYPE_10',
].map((value) => ({
  value: value as LabTestTypeTier,
  label: formatLabTestTypeTier(value),
}));
