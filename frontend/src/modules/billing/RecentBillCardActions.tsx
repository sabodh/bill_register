import {
  CheckCircleOutlined,
  EditOutlined,
  FilePdfOutlined,
  MoreOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { Button, Dropdown, Modal, message } from 'antd';
import type { MenuProps } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { apiClient } from '../../api/client';
import type { BillDetailRecord } from '../../api/types/models';
import { completeBillPayment } from './completeBillPayment';
import { billPdfPageSizeLabel, downloadBillPdfFromDetail } from './pdf/downloadBillPdf';
import { formatMoney } from '../patients/patientRegistrationSchema';

type RecentBillCardActionsProps = {
  billId: number;
  billNumber: string;
  balanceDue?: number;
  billTotal?: number;
  onEdit?: (billId: number) => void;
  onCancelled?: (billId: number) => void;
  onPaymentCompleted?: (billId: number) => void;
};

export function RecentBillCardActions({
  billId,
  billNumber,
  balanceDue = 0,
  billTotal,
  onEdit,
  onCancelled,
  onPaymentCompleted,
}: RecentBillCardActionsProps) {
  const queryClient = useQueryClient();
  const paymentPending = balanceDue > 0;

  const pdfMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.get<BillDetailRecord>(`/billing/bills/${billId}/`);
      return downloadBillPdfFromDetail(data);
    },
    onSuccess: (snapshot) => {
      message.success(`PDF downloaded (${billPdfPageSizeLabel(snapshot)})`);
    },
    onError: () => message.error('Could not generate PDF'),
  });

  const completePaymentMutation = useMutation({
    mutationFn: () => completeBillPayment(billId, 'lab'),
    onSuccess: () => {
      message.success(`Payment completed for ${billNumber}`);
      void queryClient.invalidateQueries({ queryKey: ['lab', 'result-bills'] });
      void queryClient.invalidateQueries({ queryKey: ['billing', 'bill', billId] });
      onPaymentCompleted?.(billId);
    },
    onError: (error: unknown) => {
      let detail: string | undefined;
      if (isAxiosError(error)) {
        const data = error.response?.data;
        if (data && typeof data === 'object' && 'detail' in data && typeof data.detail === 'string') {
          detail = data.detail;
        }
      }
      message.error(detail ?? 'Could not complete payment');
    },
  });

  const confirmCompletePayment = () => {
    const totalLabel =
      billTotal != null && billTotal > 0 ? formatMoney(billTotal) : 'the bill total';
    Modal.confirm({
      title: 'Complete payment?',
      content: `Record that the patient paid the full amount for ${billNumber}? Advance will be set to ${totalLabel} and the balance will be zero.`,
      okText: 'Complete payment',
      cancelText: 'Not yet',
      onOk: async () => {
        await completePaymentMutation.mutateAsync();
      },
    });
  };

  const cancelMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post(`/billing/bills/${billId}/cancel/`);
    },
    onSuccess: () => {
      message.success(`Bill ${billNumber} cancelled`);
      void queryClient.invalidateQueries({ queryKey: ['lab', 'result-bills'] });
      onCancelled?.(billId);
    },
    onError: () => message.error('Could not cancel bill'),
  });

  const confirmCancel = () => {
    Modal.confirm({
      title: 'Cancel this bill?',
      content: `${billNumber} will be removed from recent bills and result entry.`,
      okText: 'Cancel bill',
      okType: 'danger',
      cancelText: 'Keep',
      onOk: () => cancelMutation.mutateAsync(),
    });
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'download-pdf',
      label: 'Download PDF',
      icon: <FilePdfOutlined />,
      disabled: pdfMutation.isPending,
    },
    ...(onEdit
      ? [
          {
            key: 'edit',
            label: 'Edit bill',
            icon: <EditOutlined />,
          },
        ]
      : []),
    ...(paymentPending
      ? [
          {
            key: 'complete-payment',
            label: 'Complete payment',
            icon: <CheckCircleOutlined />,
          },
        ]
      : []),
    {
      key: 'cancel',
      label: 'Cancel bill',
      icon: <StopOutlined />,
      danger: true,
    },
  ];

  const onMenuClick: MenuProps['onClick'] = ({ key, domEvent }) => {
    domEvent.stopPropagation();
    if (key === 'download-pdf') {
      pdfMutation.mutate();
      return;
    }
    if (key === 'edit' && onEdit) {
      onEdit(billId);
      return;
    }
    if (key === 'complete-payment') {
      confirmCompletePayment();
      return;
    }
    if (key === 'cancel') {
      confirmCancel();
    }
  };

  const menuLoading =
    pdfMutation.isPending || completePaymentMutation.isPending || cancelMutation.isPending;

  return (
    <Dropdown
      menu={{ items: menuItems, onClick: onMenuClick }}
      trigger={['click']}
      placement="bottomRight"
      getPopupContainer={() => document.body}
      disabled={menuLoading}
    >
      <Button
        type="text"
        size="small"
        className="lab-catalog-card-actions lab-bill-card-actions-btn"
        icon={<MoreOutlined />}
        aria-label={`Actions for ${billNumber}`}
        loading={menuLoading}
        onClick={(e) => e.stopPropagation()}
      />
    </Dropdown>
  );
}
