import { pdf } from '@react-pdf/renderer';

import { LabResultPdfDocument } from './LabResultPdfDocument';
import type { LabResultPdfSnapshot } from './labResultPdfTypes';

export async function createLabResultPdfBlobUrl(snapshot: LabResultPdfSnapshot): Promise<string> {
  const blob = await pdf(<LabResultPdfDocument snapshot={snapshot} />).toBlob();
  return URL.createObjectURL(blob);
}
