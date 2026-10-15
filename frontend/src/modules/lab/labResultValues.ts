import type { LabResultBillDetail, LabResultWorkItem, LabSavedResult } from '../../api/types/models';

/** Stored on the bill line; does not update the lab test master. */
export const LAB_RESULT_NOTE_KEY = 'note';

export function resultValueKey(
  billLineId: number,
  labTestId: number,
  resultKey: string,
): string {
  return `${billLineId}:${labTestId}:${resultKey}`;
}

export function resultNoteValueKey(billLineId: number, labTestId: number): string {
  return resultValueKey(billLineId, labTestId, LAB_RESULT_NOTE_KEY);
}

export function savedResultsToMap(saved: LabSavedResult[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const row of saved) {
    if (row.lab_test_id == null) {
      continue;
    }
    map[resultValueKey(row.bill_line_id, row.lab_test_id, row.result_key)] = row.value;
  }
  return map;
}

export function collectResultPayload(
  workItems: LabResultWorkItem[],
  values: Record<string, string>,
): LabSavedResult[] {
  const entries: LabSavedResult[] = [];
  for (const item of workItems) {
    const layout = item.result_entry_layout;
    if (layout.layout !== 'billing_only') {
    if (layout.layout === 'single' || layout.layout === 'multi_reference') {
      entries.push({
        bill_line_id: item.bill_line_id,
        lab_test_id: item.lab_test_id,
        result_key: layout.result_key,
        value:
          values[resultValueKey(item.bill_line_id, item.lab_test_id, layout.result_key)] ?? '',
      });
    } else if (layout.layout === 'panel') {
      for (const row of layout.rows) {
        entries.push({
          bill_line_id: item.bill_line_id,
          lab_test_id: item.lab_test_id,
          result_key: row.result_key,
          value:
            values[resultValueKey(item.bill_line_id, item.lab_test_id, row.result_key)] ?? '',
        });
      }
    }
    }
    entries.push({
      bill_line_id: item.bill_line_id,
      lab_test_id: item.lab_test_id,
      result_key: LAB_RESULT_NOTE_KEY,
      value: values[resultNoteValueKey(item.bill_line_id, item.lab_test_id)] ?? '',
    });
  }
  return entries;
}

export function hydrateResultValuesFromBill(bill: LabResultBillDetail): Record<string, string> {
  return savedResultsToMap(bill.saved_results ?? []);
}
