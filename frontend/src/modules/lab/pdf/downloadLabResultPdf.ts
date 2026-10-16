import { createLabResultPdfBlobUrl } from './createLabResultPdfBlobUrl';
import type { LabResultPrintFormatTemplate } from './labResultPrintFormats';
import type { LabResultPdfRenderOptions } from './labResultPdfRender';
import type { LabResultPdfSnapshot } from './labResultPdfTypes';

export async function downloadLabResultPdf(
  snapshot: LabResultPdfSnapshot,
  options?: LabResultPdfRenderOptions,
  template: LabResultPrintFormatTemplate = 'standard',
): Promise<void> {
  const url = await createLabResultPdfBlobUrl(snapshot, options, template);
  const link = document.createElement('a');
  link.href = url;
  link.download = `LabResult-${snapshot.bill_number}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

export function printLabResultPdf(url: string): void {
  const frame = document.createElement('iframe');
  frame.style.position = 'fixed';
  frame.style.right = '0';
  frame.style.bottom = '0';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = 'none';
  frame.src = url;
  document.body.appendChild(frame);
  frame.onload = () => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    window.setTimeout(() => {
      document.body.removeChild(frame);
    }, 1000);
  };
}
