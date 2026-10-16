import { pdf } from '@react-pdf/renderer';

import { LabResultPdfDocument } from './LabResultPdfDocument';
import {
  DEFAULT_LETTERHEAD_BAND_HEIGHT_PT,
  LETTERPAD_BAND_HEIGHT_PT,
  letterheadBandHeightFromImagePx,
} from './labResultLetterheadLayout';
import { rasterDataUrlSize, resolveLetterheadImageForPdf } from './labResultLetterheadImage';
import type { LabResultPdfRenderOptions } from './labResultPdfRender';
import { labResultPdfSnapshotForRender } from './labResultPdfRender';
import type { LabResultPdfSnapshot } from './labResultPdfTypes';

function isBundledSampleLetterheadUrl(url: string): boolean {
  return url.includes('letterhead-sample') || url.includes('/assets/lab-report/');
}

export async function createLabResultPdfBlobUrl(
  snapshot: LabResultPdfSnapshot,
  options?: LabResultPdfRenderOptions,
): Promise<string> {
  const renderSnapshot = options ? labResultPdfSnapshotForRender(snapshot, options) : snapshot;
  const showLetterheadImage = options?.includeLetterhead ?? true;

  let letterheadImageSrc: string | null = null;
  let useBuiltInSampleLetterhead = false;
  let letterheadBandHeightPt = LETTERPAD_BAND_HEIGHT_PT;

  const letterheadUrl = snapshot.letterhead_image_url?.trim();
  if (letterheadUrl) {
    const resolved = await resolveLetterheadImageForPdf(letterheadUrl);
    if (resolved) {
      const size = await rasterDataUrlSize(resolved);
      if (size) {
        letterheadBandHeightPt = letterheadBandHeightFromImagePx(size.width, size.height);
      } else {
        letterheadBandHeightPt = DEFAULT_LETTERHEAD_BAND_HEIGHT_PT;
      }
      if (showLetterheadImage) {
        letterheadImageSrc = resolved;
      }
    } else if (isBundledSampleLetterheadUrl(letterheadUrl)) {
      letterheadBandHeightPt = DEFAULT_LETTERHEAD_BAND_HEIGHT_PT;
      if (showLetterheadImage) {
        useBuiltInSampleLetterhead = true;
      }
    }
  }

  const blob = await pdf(
    <LabResultPdfDocument
      snapshot={renderSnapshot}
      renderOptions={options}
      letterheadImageSrc={letterheadImageSrc}
      useBuiltInSampleLetterhead={useBuiltInSampleLetterhead}
      letterheadBandHeightPt={letterheadBandHeightPt}
    />,
  ).toBlob();
  return URL.createObjectURL(blob);
}
