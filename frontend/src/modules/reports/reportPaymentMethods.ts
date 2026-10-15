import type { ColumnsType } from 'antd/es/table';

import { formatPaymentMethod } from '../billing/pdf/billPdfFormat';
import { formatMoney } from '../patients/patientRegistrationSchema';

export const PAYMENT_METHOD_CODES = ['CASH', 'UPI', 'CARD', 'CREDIT'] as const;

export type CollectedByMethod = Partial<Record<(typeof PAYMENT_METHOD_CODES)[number], string>>;

export function collectedByMethodColumns(): ColumnsType<Record<string, unknown>> {
  return PAYMENT_METHOD_CODES.map((code) => ({
    title: formatPaymentMethod(code),
    dataIndex: `collected_${code.toLowerCase()}`,
    key: `collected_${code.toLowerCase()}`,
    width: 100,
    align: 'right' as const,
    render: (v: string) => formatMoney(Number(v ?? 0)),
  }));
}

export function paymentMethodExportHeaders(): { header: string; key: string }[] {
  return PAYMENT_METHOD_CODES.map((code) => ({
    header: formatPaymentMethod(code),
    key: `collected_${code.toLowerCase()}`,
  }));
}
