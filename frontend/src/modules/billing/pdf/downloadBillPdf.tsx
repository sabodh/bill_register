import { pdf } from '@react-pdf/renderer';

import type { BillDetailRecord } from '../../../api/types/models';
import { BillPdfDocument } from './BillPdfDocument';
import { chooseBillPageSize } from './billPageSize';
import { billPdfSnapshotFromDetail } from './billPdfSnapshot';
import type { BillPdfSnapshot } from './billPdfTypes';

export async function downloadBillPdfFromDetail(bill: BillDetailRecord): Promise<BillPdfSnapshot> {
  const snapshot = billPdfSnapshotFromDetail(bill);
  await downloadBillPdf(snapshot);
  return snapshot;
}

export async function downloadBillPdf(snapshot: BillPdfSnapshot): Promise<void> {
  const blob = await pdf(<BillPdfDocument snapshot={snapshot} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Bill-${snapshot.bill_number}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

export function billPdfPageSizeLabel(snapshot: BillPdfSnapshot): string {
  return chooseBillPageSize(snapshot);
}
