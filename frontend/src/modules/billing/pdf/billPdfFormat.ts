export function formatBillPdfMoney(value: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
}

export function formatBillPdfDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Cash',
  UPI: 'UPI',
  CARD: 'Card',
  CREDIT: 'Credit',
};

export function formatPaymentMethod(code: string): string {
  return PAYMENT_LABELS[code] ?? code;
}

export function formatPatientAgeSex(gender: 'M' | 'F' | 'O', ageYears: number | null): string {
  const agePart = ageYears != null ? `${ageYears}y` : '—';
  const sex = { M: 'Male', F: 'Female', O: 'Other' }[gender];
  return `${agePart} / ${sex}`;
}
