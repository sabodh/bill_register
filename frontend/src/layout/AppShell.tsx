import { Grid, Layout } from 'antd';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

const { Content } = Layout;
const { useBreakpoint } = Grid;

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const screens = useBreakpoint();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <Layout>
        <Topbar onMenuClick={() => screens.lg === false && setMobileOpen(true)} />
        <Content style={{ padding: '1.25rem 1.5rem', background: '#f5f7fa' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
