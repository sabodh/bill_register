import type { LabResultBillDetail, LabResultWorkItem } from '../../../api/types/models';
import { formatVariantDisplayText } from '../labVariantDisplay';
import {
  LAB_RESULT_NOTE_KEY,
  hydrateResultValuesFromBill,
  resultValueKey,
} from '../labResultValues';
import type { LabResultPdfRow, LabResultPdfSection, LabResultPdfSnapshot, LabResultPdfTest } from './labResultPdfTypes';
import { formatPatientAgeSex } from '../../billing/pdf/billPdfFormat';
import { resolveMediaUrl } from '../../../utils/resolveMediaUrl';
import { DEFAULT_LAB_REPORT_LETTERHEAD_URL } from './defaultLabLetterhead';

function valueFor(
  values: Record<string, string>,
  billLineId: number,
  labTestId: number,
  resultKey: string,
): string {
  return (values[resultValueKey(billLineId, labTestId, resultKey)] ?? '').trim();
}

function rowsForWorkItem(item: LabResultWorkItem, values: Record<string, string>): LabResultPdfRow[] {
  const layout = item.result_entry_layout;
  if (layout.layout === 'billing_only') {
    return [];
  }

  if (layout.layout === 'single') {
    return [
      {
        name: item.test_name,
        result: valueFor(values, item.bill_line_id, item.lab_test_id, layout.result_key),
        reference: layout.reference ?? '—',
        unit: layout.unit ?? '',
      },
    ];
  }

  if (layout.layout === 'multi_reference') {
    const ref =
      layout.variants.length === 0
        ? '—'
        : layout.variants
            .map(
              (v) =>
                v.display_text ??
                formatVariantDisplayText(v.label, v.reference_low, v.reference_high, v.unit),
            )
            .join('\n');
    return [
      {
        name: item.test_name,
        result: valueFor(values, item.bill_line_id, item.lab_test_id, layout.result_key),
        reference: ref,
        unit: layout.unit ?? '',
      },
    ];
  }

  if (layout.layout === 'panel') {
    const panelRows: LabResultPdfRow[] = [];
    for (const row of layout.rows) {
      panelRows.push({
        name: row.subtest_name,
        result: valueFor(values, item.bill_line_id, item.lab_test_id, row.result_key),
        reference: row.reference ?? '—',
        unit: row.unit ?? '',
        isSubtest: true,
      });
    }
    return panelRows;
  }

  return [];
}

function resolveMethodName(item: LabResultWorkItem): string {
  const fromWorkItem = (item.method_name ?? '').trim();
  if (fromWorkItem) {
    return fromWorkItem;
  }
  const layout = item.result_entry_layout;
  if (layout.layout !== 'billing_only') {
    return (layout.method_name ?? '').trim();
  }
  return '';
}

function testBlockFromItem(item: LabResultWorkItem, values: Record<string, string>): LabResultPdfTest | null {
  const rows = rowsForWorkItem(item, values);
  if (rows.length === 0) {
    return null;
  }
  const interpretation = valueFor(values, item.bill_line_id, item.lab_test_id, LAB_RESULT_NOTE_KEY);
  const layout = item.result_entry_layout;
  const isPanel = layout.layout === 'panel';
  const title =
    isPanel ? layout.panel_title || item.test_name : item.test_name;
  return {
    title,
    testCode: item.test_code ?? '',
    methodName: resolveMethodName(item),
    isPanel,
    rows,
    interpretation,
  };
}

function groupSections(workItems: LabResultWorkItem[], values: Record<string, string>): LabResultPdfSection[] {
  const order: string[] = [];
  const map = new Map<string, LabResultPdfTest[]>();

  for (const item of workItems) {
    const dept = item.department_name?.trim() || 'General';
    if (!map.has(dept)) {
      map.set(dept, []);
      order.push(dept);
    }
    const block = testBlockFromItem(item, values);
    if (block) {
      map.get(dept)!.push(block);
    }
  }

  return order.map((departmentName) => ({
    departmentName,
    tests: map.get(departmentName) ?? [],
  }));
}

export function labResultPdfSnapshotFromBill(
  bill: LabResultBillDetail,
  values?: Record<string, string>,
): LabResultPdfSnapshot {
  const valueMap = values ?? hydrateResultValuesFromBill(bill);
  const patient = bill.patient_detail;
  const gender = (patient?.gender ?? 'O') as 'M' | 'F' | 'O';

  return {
    bill_number: bill.bill_number,
    letterhead_image_url:
      resolveMediaUrl(bill.letterhead_image_url ?? null) ?? DEFAULT_LAB_REPORT_LETTERHEAD_URL,
    hospital_name: bill.hospital_name?.trim() || '—',
    doctor_name: bill.doctor_name?.trim() || '—',
    sample_collected_at: bill.sample_collected_at,
    sample_tested_at: bill.sample_tested_at,
    reported_at: bill.sample_tested_at ?? new Date().toISOString(),
    patient: {
      name: patient?.name ?? '—',
      uhid: patient?.uhid ?? '—',
      phone: patient?.phone ?? '—',
      ageSex: formatPatientAgeSex(gender, patient?.age_years ?? null),
      age_years: patient?.age_years ?? null,
      gender,
    },
    sections: groupSections(bill.work_items, valueMap),
  };
}
