import { pdf } from '@react-pdf/renderer';

import { BillPdfDocument } from './BillPdfDocument';
import type { BillPdfSnapshot } from './billPdfTypes';

export async function createBillPdfBlobUrl(snapshot: BillPdfSnapshot): Promise<string> {
  const blob = await pdf(<BillPdfDocument snapshot={snapshot} />).toBlob();
  return URL.createObjectURL(blob);
}
