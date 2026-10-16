import type { BillDetailRecord } from '../../../api/types/models';
import { createBillPdfBlobUrl } from './createBillPdfBlobUrl';
import type { BillPdfRenderOptions } from './billPdfRender';
import { chooseBillPageSize } from './billPageSize';
import { billPdfSnapshotFromDetail } from './billPdfSnapshot';
import type { BillPdfSnapshot } from './billPdfTypes';

export async function downloadBillPdfFromDetail(bill: BillDetailRecord): Promise<BillPdfSnapshot> {
  const snapshot = billPdfSnapshotFromDetail(bill);
  await downloadBillPdf(snapshot);
  return snapshot;
}

export async function downloadBillPdf(
  snapshot: BillPdfSnapshot,
  options?: BillPdfRenderOptions,
): Promise<void> {
  const url = await createBillPdfBlobUrl(snapshot, options);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Bill-${snapshot.bill_number}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

export function billPdfPageSizeLabel(snapshot: BillPdfSnapshot): string {
  return chooseBillPageSize(snapshot);
}
