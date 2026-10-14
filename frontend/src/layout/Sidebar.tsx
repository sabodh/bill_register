import {
  CustomerServiceOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Button, Drawer, Grid, Layout, Menu, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { filterMenuByPermissions, menuConfig, type MenuItemConfig } from '../config/menu';

const { Sider } = Layout;
const { useBreakpoint } = Grid;

function buildMenuItems(items: MenuItemConfig[]): MenuProps['items'] {
  return items.map((item) => {
    if (item.children) {
      return {
        key: item.key,
        label: item.label,
        children: buildMenuItems(item.children),
      };
    }
    return { key: item.key, label: item.label };
  });
}

function resolvePath(items: MenuItemConfig[], key: string): string | undefined {
  for (const item of items) {
    if (item.key === key) {
      return item.path;
    }
    if (item.children) {
      const nested = resolvePath(item.children, key);
      if (nested) {
        return nested;
      }
    }
  }
  return undefined;
}

type SidebarProps = {
  mobileOpen: boolean;
  onMobileClose: () => void;
};

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [openKeys, setOpenKeys] = useState<string[]>(['registration', 'lab']);
  const { permissions, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const isMobile = !screens.lg;

  const visibleMenu = useMemo(
    () => filterMenuByPermissions(menuConfig, permissions),
    [permissions],
  );

  const menuItems = useMemo(() => buildMenuItems(visibleMenu), [visibleMenu]);

  const selectedKey = useMemo(() => {
    let best: { key: string; pathLen: number } | undefined;
    const visit = (items: MenuItemConfig[]) => {
      for (const item of items) {
        if (item.path) {
          const exact = location.pathname === item.path;
          const nested = location.pathname.startsWith(`${item.path}/`);
          if (exact || nested) {
            const pathLen = item.path.length;
            if (!best || pathLen > best.pathLen) {
              best = { key: item.key, pathLen };
            }
          }
        }
        if (item.children) {
          visit(item.children);
        }
      }
    };
    visit(visibleMenu);
    return best?.key ?? 'dashboard';
  }, [location.pathname, visibleMenu]);

  useEffect(() => {
    if (location.pathname === '/billing' || location.pathname.startsWith('/lab')) {
      setOpenKeys((keys) => (keys.includes('lab') ? keys : [...keys, 'lab']));
    }
    if (location.pathname.startsWith('/reports')) {
      setOpenKeys((keys) => {
        const next = new Set(keys);
        next.add('reports');
        next.add('reports-lab-bills');
        return [...next];
      });
    }
  }, [location.pathname]);

  const onMenuClick: MenuProps['onClick'] = ({ key }) => {
    const path = resolvePath(visibleMenu, key);
    if (path) {
      navigate(path);
      onMobileClose();
    }
  };

  const siderContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          padding: collapsed && !isMobile ? '1rem 0.5rem' : '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: '#14b8a6',
            flexShrink: 0,
          }}
        />
        {(!collapsed || isMobile) && (
          <Typography.Text strong style={{ color: '#fff' }}>HMS</Typography.Text>
        )}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        openKeys={openKeys}
        onOpenChange={setOpenKeys}
        items={menuItems}
        onClick={onMenuClick}
        style={{ flex: 1, borderInlineEnd: 0 }}
      />
      <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        {(!collapsed || isMobile) && user && (
          <Typography.Text style={{ color: 'rgba(255,255,255,0.85)', display: 'block' }}>
            {user.first_name || user.username}
          </Typography.Text>
        )}
        <Button type="text" icon={<CustomerServiceOutlined />} style={{ color: '#fff' }} block>
          Support
        </Button>
        <Button type="text" icon={<SettingOutlined />} style={{ color: '#fff' }} block>
          Settings
        </Button>
        <Button
          type="text"
          icon={<LogoutOutlined />}
          style={{ color: '#fff' }}
          block
          onClick={() => {
            logout();
            navigate('/login');
          }}
        >
          Log out
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer
        placement="left"
        open={mobileOpen}
        onClose={onMobileClose}
        styles={{ body: { padding: 0, background: '#001529' } }}
        width={280}
      >
        {siderContent}
      </Drawer>
    );
  }

  return (
      <Sider
        className="app-shell-sider" collapsible collapsed={collapsed} onCollapse={setCollapsed} width={260}>
      {siderContent}
    </Sider>
  );
}
