export type BillPdfRenderOptions = {
  /** Hospital name, patient block, doctor, and bill metadata above line items. */
  includeLetterhead: boolean;
};

export const DEFAULT_BILL_PDF_RENDER_OPTIONS: BillPdfRenderOptions = {
  includeLetterhead: true,
};
