import { DeleteOutlined, EditOutlined, MoreOutlined } from '@ant-design/icons';
import { Button, Dropdown, Modal, message } from 'antd';
import type { MenuProps } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { apiClient } from '../../api/client';

type LabCatalogCardActionsProps = {
  kind: 'test' | 'package';
  id: number;
  name: string;
};

export function LabCatalogCardActions({ kind, id, name }: LabCatalogCardActionsProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const path = kind === 'test' ? `/lab/tests/${id}/` : `/lab/packages/${id}/`;
      await apiClient.delete(path);
    },
    onSuccess: () => {
      message.success(kind === 'test' ? 'Test removed' : 'Package removed');
      void queryClient.invalidateQueries({ queryKey: ['lab-tests'] });
      void queryClient.invalidateQueries({ queryKey: ['lab-packages'] });
    },
    onError: () => {
      message.error(kind === 'test' ? 'Could not remove test' : 'Could not remove package');
    },
  });

  const confirmDelete = () => {
    Modal.confirm({
      title: kind === 'test' ? 'Remove this test?' : 'Remove this package?',
      content: `"${name}" will be deactivated (soft delete).`,
      okText: 'Remove',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => deleteMutation.mutateAsync(),
    });
  };

  const onEdit = () => {
    navigate(kind === 'test' ? `/lab/tests/${id}` : `/lab/packages/${id}`);
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      onClick: ({ domEvent }) => {
        domEvent.stopPropagation();
        onEdit();
      },
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: ({ domEvent }) => {
        domEvent.stopPropagation();
        confirmDelete();
      },
    },
  ];

  return (
    <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
      <Button
        type="text"
        size="small"
        className="lab-catalog-card-actions"
        icon={<MoreOutlined />}
        aria-label={`Actions for ${name}`}
        onClick={(e) => e.stopPropagation()}
      />
    </Dropdown>
  );
}
