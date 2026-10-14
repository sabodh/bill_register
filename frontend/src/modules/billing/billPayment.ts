export type BillPaymentAmounts = {
  total_amount: string;
  advance_paid?: string;
  balance_due?: string;
};

export function billBalanceDue(bill: BillPaymentAmounts): number {
  if (bill.balance_due != null && bill.balance_due !== '') {
    return Number(bill.balance_due);
  }
  return Math.max(0, Number(bill.total_amount) - Number(bill.advance_paid ?? 0));
}

export function billPaymentStatus(balanceDue: number): { label: string; color: 'warning' } | null {
  if (balanceDue <= 0) {
    return null;
  }
  return { label: 'Balance pending', color: 'warning' };
}
