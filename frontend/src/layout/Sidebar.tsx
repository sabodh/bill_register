import {
  CustomerServiceOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  QuestionCircleOutlined,
  RightOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Button, Drawer, Grid, Layout, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { filterMenuSections, findSelectedMenuKey, menuSections } from '../config/menu';
import { useAuth } from '../auth/AuthContext';
import { AppSidebarNav } from './AppSidebarNav';
import { AppSidebarNavCollapsed } from './AppSidebarNavCollapsed';
import { readSidebarCollapsed, writeSidebarCollapsed } from './sidebarStorage';

const { Sider } = Layout;
const { useBreakpoint } = Grid;

const SIDEBAR_WIDTH = 240;
const SIDEBAR_COLLAPSED_WIDTH = 72;

type SidebarProps = {
  mobileOpen: boolean;
  onMobileClose: () => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
};

export function Sidebar({
  mobileOpen,
  onMobileClose,
  collapsed: collapsedProp,
  onCollapsedChange,
}: SidebarProps) {
  const [collapsedInternal, setCollapsedInternal] = useState(readSidebarCollapsed);
  const collapsed = collapsedProp ?? collapsedInternal;

  const setCollapsed = (next: boolean) => {
    writeSidebarCollapsed(next);
    setCollapsedInternal(next);
    onCollapsedChange?.(next);
  };

  const toggleCollapsed = () => setCollapsed(!collapsed);

  const { permissions, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const isMobile = !screens.lg;

  const visibleSections = useMemo(
    () => filterMenuSections(menuSections, permissions),
    [permissions],
  );

  const selectedKey = useMemo(() => {
    const items = visibleSections.flatMap((section) => section.items);
    return findSelectedMenuKey(items, location.pathname) ?? 'dashboard';
  }, [location.pathname, visibleSections]);

  const handleNavigate = (_key: string, path: string) => {
    navigate(path);
    onMobileClose();
  };

  const handleFooterNav = (path: string) => {
    navigate(path);
    onMobileClose();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    onMobileClose();
  };

  const isCollapsedDesktop = collapsed && !isMobile;

  const siderContent = (
    <div
      className={`app-shell-sidebar-inner${
        isCollapsedDesktop ? ' app-shell-sidebar-inner--collapsed' : ''
      }`}
    >
      <header
        className={`app-shell-sidebar-brand${
          isCollapsedDesktop ? ' app-shell-sidebar-brand--compact' : ''
        }`}
      >
        {isCollapsedDesktop ? (
          <>
            <Button
              type="text"
              className="app-shell-sidebar-menu-btn"
              icon={<MenuOutlined />}
              onClick={toggleCollapsed}
              aria-label="Expand menu"
            />
            <div className="app-shell-sidebar-logo app-shell-sidebar-logo--compact" aria-hidden />
          </>
        ) : (
          <>
            <div className="app-shell-sidebar-logo" aria-hidden />
            <div className="app-shell-sidebar-brand-text">
              <Typography.Text className="app-shell-sidebar-title">HMS</Typography.Text>
              {user?.branch_detail?.name ? (
                <Typography.Text className="app-shell-sidebar-branch">
                  {user.branch_detail.name}
                </Typography.Text>
              ) : null}
            </div>
            {!isMobile ? (
              <Button
                type="text"
                className="app-shell-sidebar-toggle"
                icon={<MenuFoldOutlined />}
                onClick={toggleCollapsed}
                aria-label="Collapse menu"
              />
            ) : null}
          </>
        )}
      </header>

      <div
        className={`app-shell-sidebar-body${
          isCollapsedDesktop ? ' app-shell-sidebar-body--collapsed' : ''
        }`}
      >
        <div className="app-shell-sidebar-panel app-shell-sidebar-panel--expanded">
          <div className="app-shell-sidebar-scroll">
            <AppSidebarNav
              sections={visibleSections}
              selectedKey={selectedKey}
              onNavigate={handleNavigate}
            />

            <div className="app-shell-nav-divider" role="presentation" />
            <div className="app-shell-nav-section">
              <div className="app-shell-nav-section-title">Account</div>
              {user ? (
                <div className="app-shell-nav-user">{user.first_name || user.username}</div>
              ) : null}
              <button type="button" className="app-shell-nav-row" onClick={() => handleFooterNav('/')}>
                <span className="app-shell-nav-row-label">
                  <CustomerServiceOutlined className="app-shell-nav-row-icon" />
                  Support
                </span>
                <RightOutlined className="app-shell-nav-chevron" aria-hidden />
              </button>
              <button type="button" className="app-shell-nav-row" onClick={() => handleFooterNav('/')}>
                <span className="app-shell-nav-row-label">
                  <SettingOutlined className="app-shell-nav-row-icon" />
                  Settings
                </span>
                <RightOutlined className="app-shell-nav-chevron" aria-hidden />
              </button>
              <button type="button" className="app-shell-nav-row" onClick={handleLogout}>
                <span className="app-shell-nav-row-label">
                  <LogoutOutlined className="app-shell-nav-row-icon" />
                  Log out
                </span>
                <RightOutlined className="app-shell-nav-chevron" aria-hidden />
              </button>
            </div>
          </div>
        </div>

        {!isMobile ? (
          <div className="app-shell-sidebar-panel app-shell-sidebar-panel--compact">
            <div className="app-shell-sidebar-scroll app-shell-sidebar-scroll--compact">
              <AppSidebarNavCollapsed
                sections={visibleSections}
                selectedKey={selectedKey}
                onNavigate={handleNavigate}
              />
            </div>
            <div className="app-shell-sidebar-compact-footer">
              <Button
                type="text"
                className="app-shell-nav-glyph-btn app-shell-sidebar-compact-footer-btn"
                icon={<SettingOutlined />}
                aria-label="Settings"
                onClick={() => handleFooterNav('/')}
              />
              <Button
                type="text"
                className="app-shell-nav-glyph-btn app-shell-sidebar-compact-footer-btn"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                aria-label="Log out"
              />
            </div>
          </div>
        ) : null}
      </div>

      {!isCollapsedDesktop ? (
        <footer className="app-shell-sidebar-footer">
          <Button
            type="text"
            className="app-shell-sidebar-help"
            icon={<QuestionCircleOutlined />}
            aria-label="Help"
          />
        </footer>
      ) : null}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer
        placement="left"
        open={mobileOpen}
        onClose={onMobileClose}
        className="app-shell-nav-drawer"
        styles={{ body: { padding: 0 } }}
        width={SIDEBAR_WIDTH}
      >
        {siderContent}
      </Drawer>
    );
  }

  return (
    <Sider
      className="app-shell-sider"
      width={SIDEBAR_WIDTH}
      collapsedWidth={SIDEBAR_COLLAPSED_WIDTH}
      collapsed={collapsed}
      trigger={null}
      theme="dark"
    >
      {siderContent}
    </Sider>
  );
}

/** Hook for AppShell / Topbar to sync collapse state. */
export function useSidebarCollapsed() {
  const [collapsed, setCollapsedState] = useState(readSidebarCollapsed);
  const setCollapsed = (next: boolean) => {
    writeSidebarCollapsed(next);
    setCollapsedState(next);
  };
  return [collapsed, setCollapsed] as const;
}
