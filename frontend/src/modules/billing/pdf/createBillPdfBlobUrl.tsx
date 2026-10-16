import { pdf } from '@react-pdf/renderer';

import { BillPdfDocument } from './BillPdfDocument';
import type { BillPdfRenderOptions } from './billPdfRender';
import type { BillPdfSnapshot } from './billPdfTypes';

export async function createBillPdfBlobUrl(
  snapshot: BillPdfSnapshot,
  options?: BillPdfRenderOptions,
): Promise<string> {
  const blob = await pdf(<BillPdfDocument snapshot={snapshot} renderOptions={options} />).toBlob();
  return URL.createObjectURL(blob);
}
