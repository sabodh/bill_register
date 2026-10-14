import { EditOutlined, MoreOutlined, StopOutlined } from '@ant-design/icons';
import { Button, Dropdown, Modal, message } from 'antd';
import type { MenuProps } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '../../api/client';

type RecentBillCardActionsProps = {
  billId: number;
  billNumber: string;
  onEdit?: (billId: number) => void;
  onCancelled?: (billId: number) => void;
};

export function RecentBillCardActions({
  billId,
  billNumber,
  onEdit,
  onCancelled,
}: RecentBillCardActionsProps) {
  const queryClient = useQueryClient();

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
    ...(onEdit
      ? [
          {
            key: 'edit',
            label: 'Edit',
            icon: <EditOutlined />,
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
    if (key === 'edit' && onEdit) {
      onEdit(billId);
      return;
    }
    if (key === 'cancel') {
      confirmCancel();
    }
  };

  return (
    <Dropdown menu={{ items: menuItems, onClick: onMenuClick }} trigger={['click']} placement="bottomRight">
      <Button
        type="text"
        size="small"
        className="lab-catalog-card-actions"
        icon={<MoreOutlined />}
        aria-label={`Actions for ${billNumber}`}
        onClick={(e) => e.stopPropagation()}
      />
    </Dropdown>
  );
}
