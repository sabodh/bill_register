import { isAxiosError } from 'axios';

import { apiClient } from '../../api/client';
import type { BillRecord } from '../../api/types/models';

export type CompleteBillPaymentSource = 'billing' | 'lab';

function completePaymentPath(billId: number, source: CompleteBillPaymentSource): string {
  if (source === 'lab') {
    return `/lab/result-bills/${billId}/complete-payment/`;
  }
  return `/billing/bills/${billId}/complete-payment/`;
}

/** Record full payment (advance = bill total). Lab path matches result-bills sidebar queryset. */
export async function completeBillPayment(
  billId: number,
  source: CompleteBillPaymentSource = 'lab',
): Promise<BillRecord> {
  const paths =
    source === 'lab'
      ? [completePaymentPath(billId, 'lab'), completePaymentPath(billId, 'billing')]
      : [completePaymentPath(billId, 'billing'), completePaymentPath(billId, 'lab')];

  let lastError: unknown;
  for (const path of paths) {
    try {
      const { data } = await apiClient.post<BillRecord>(path);
      return data;
    } catch (error) {
      lastError = error;
      if (isAxiosError(error) && error.response?.status === 404) {
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}
