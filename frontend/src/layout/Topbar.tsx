import { MenuOutlined } from '@ant-design/icons';
import { Button, Layout, Typography } from 'antd';

import { useAuth } from '../auth/AuthContext';

const { Header } = Layout;

type TopbarProps = {
  onMenuClick: () => void;
  showMenuButton?: boolean;
};

export function Topbar({ onMenuClick, showMenuButton = false }: TopbarProps) {
  const { user } = useAuth();
  const hospitalName = user?.branch_detail?.name?.trim();

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
      {showMenuButton ? (
        <Button
          type="text"
          icon={<MenuOutlined />}
          className="topbar-menu-btn topbar-menu-btn--visible"
          onClick={onMenuClick}
          aria-label="Open navigation"
        />
      ) : null}
      {hospitalName ? (
        <Typography.Text strong className="app-shell-topbar-hospital">
          {hospitalName}
        </Typography.Text>
      ) : null}
    </Header>
  );
}
