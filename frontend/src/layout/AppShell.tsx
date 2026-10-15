import { Grid, Layout } from 'antd';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import { Sidebar, useSidebarCollapsed } from './Sidebar';
import { Topbar } from './Topbar';

const { Content } = Layout;
const { useBreakpoint } = Grid;

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useSidebarCollapsed();
  const screens = useBreakpoint();
  const isMobile = screens.lg === false;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />
      <Layout>
        <Topbar
          onMenuClick={() => setMobileOpen(true)}
          showMenuButton={isMobile}
        />
        <Content style={{ padding: '1.25rem 1.5rem', background: '#f5f7fa' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
