/** A4 width and {@link LabResultPdfDocument} horizontal padding (pt). */
export const LAB_RESULT_PAGE_WIDTH_PT = 595.28;
export const LAB_RESULT_PAGE_HORIZONTAL_PADDING_PT = 20;

export const LAB_RESULT_PDF_CONTENT_WIDTH_PT =
  LAB_RESULT_PAGE_WIDTH_PT - 2 * LAB_RESULT_PAGE_HORIZONTAL_PADDING_PT;

/** Bundled sample asset (`letterhead-sample.png`). */
export const DEFAULT_LETTERHEAD_PIXEL_WIDTH = 2480;
export const DEFAULT_LETTERHEAD_PIXEL_HEIGHT = 350;

/** 2 in letterpad when no letterhead image is configured. */
export const LETTERPAD_BAND_HEIGHT_PT = 144;

export function letterheadBandHeightFromImagePx(imageWidthPx: number, imageHeightPx: number): number {
  if (imageWidthPx <= 0 || imageHeightPx <= 0) {
    return LETTERPAD_BAND_HEIGHT_PT;
  }
  return (LAB_RESULT_PDF_CONTENT_WIDTH_PT * imageHeightPx) / imageWidthPx;
}

export const DEFAULT_LETTERHEAD_BAND_HEIGHT_PT = letterheadBandHeightFromImagePx(
  DEFAULT_LETTERHEAD_PIXEL_WIDTH,
  DEFAULT_LETTERHEAD_PIXEL_HEIGHT,
);
