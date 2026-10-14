import type { BillPdfPageSize, BillPdfSnapshot } from './billPdfTypes';

/** Short bills print on A5; longer content uses A4. */
export function chooseBillPageSize(snapshot: BillPdfSnapshot): BillPdfPageSize {
  const extraRows =
    (snapshot.discount_applied > 0 ? 1 : 0) +
    (snapshot.advance_paid > 0 ? 1 : 0) +
    (snapshot.balance_due > 0 ? 1 : 0) +
    (snapshot.notes.trim() ? 2 : 0) +
    (snapshot.payment_transaction_id.trim() ? 1 : 0);
  const contentUnits = snapshot.lines.length + extraRows;
  return contentUnits <= 8 ? 'A5' : 'A4';
}
