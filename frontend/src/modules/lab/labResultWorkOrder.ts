import type { LabResultWorkItem } from '../../api/types/models';

export function workItemOrderKey(
  item: Pick<LabResultWorkItem, 'bill_line_id' | 'lab_test_id'>,
): string {
  return `${item.bill_line_id}:${item.lab_test_id}`;
}

export function workItemOrderFromItems(items: LabResultWorkItem[]): string[] {
  return items.map(workItemOrderKey);
}

export function workItemsInOrder(
  all: LabResultWorkItem[],
  orderKeys: string[],
): LabResultWorkItem[] {
  const map = new Map(all.map((item) => [workItemOrderKey(item), item]));
  const ordered: LabResultWorkItem[] = [];
  const seen = new Set<string>();
  for (const key of orderKeys) {
    const item = map.get(key);
    if (item && !seen.has(key)) {
      ordered.push(item);
      seen.add(key);
    }
  }
  for (const item of all) {
    const key = workItemOrderKey(item);
    if (!seen.has(key)) {
      ordered.push(item);
    }
  }
  return ordered;
}

export function workItemOrderPayload(items: LabResultWorkItem[]): {
  bill_line_id: number;
  lab_test_id: number;
}[] {
  return items.map((item) => ({
    bill_line_id: item.bill_line_id,
    lab_test_id: item.lab_test_id,
  }));
}

export function reorderWorkItemKeys(
  orderKeys: string[],
  fromIndex: number,
  toIndex: number,
): string[] {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= orderKeys.length ||
    toIndex >= orderKeys.length ||
    fromIndex === toIndex
  ) {
    return orderKeys;
  }
  const next = [...orderKeys];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}
