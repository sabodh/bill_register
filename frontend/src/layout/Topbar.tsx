import { MenuOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Input, Layout } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';

const { Header } = Layout;

type TopbarProps = {
  onMenuClick: () => void;
};

export function Topbar({ onMenuClick }: TopbarProps) {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const primaryAction = hasPermission('core.add_patient')
    ? { label: 'Registration desk', path: '/registration' }
    : hasPermission('core.add_user')
      ? { label: 'New user', path: '/users/new' }
      : null;

  return (
    <Header
      className="app-shell-header"
      style={{
        background: '#fff',
        padding: '0 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      <Button
        type="text"
        icon={<MenuOutlined />}
        className="topbar-menu-btn"
        onClick={onMenuClick}
        aria-label="Open navigation"
      />
      <Input
        prefix={<SearchOutlined />}
        placeholder="Global search (coming soon)"
        style={{ maxWidth: 420, flex: 1 }}
        disabled
      />
      {primaryAction && (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate(primaryAction.path)}
        >
          {primaryAction.label}
        </Button>
      )}
    </Header>
  );
}
