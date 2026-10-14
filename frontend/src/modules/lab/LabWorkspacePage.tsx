import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, Space, Tabs, Typography } from 'antd';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { PageHeader } from '../../components/PageHeader';
import { LabPackagePanel } from './LabPackagePanel';
import { LabTestFormPanel } from './LabTestFormPanel';
import { LabWorkspaceBrowsePanel, type LabBrowseListMode } from './LabWorkspaceBrowsePanel';
import { useLabWorkspace } from './labWorkspaceContext';

export function LabWorkspacePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isPackagesRoute = location.pathname.includes('/lab/packages');

  const {
    tabs,
    activeKey,
    setActiveKey,
    addTab,
    removeTab,
    openTestInTab,
    openPackageInTab,
    handleTitleChange,
    closeTabAfterSuccess,
    updateTabAfterSave,
    activeTab,
  } = useLabWorkspace();

  const deepLinkHandledRef = useRef<string | null>(null);

  useEffect(() => {
    if (!id || id === 'new') {
      deepLinkHandledRef.current = null;
      return;
    }
    const numericId = Number(id);
    if (Number.isNaN(numericId)) {
      return;
    }
    const deepLinkKey = `${isPackagesRoute ? 'package' : 'test'}:${numericId}`;
    if (deepLinkHandledRef.current === deepLinkKey) {
      return;
    }
    deepLinkHandledRef.current = deepLinkKey;
    if (isPackagesRoute) {
      openPackageInTab(numericId);
      navigate('/lab/packages', { replace: true });
    } else {
      openTestInTab(numericId);
      navigate('/lab/tests', { replace: true });
    }
  }, [id, isPackagesRoute, navigate, openPackageInTab, openTestInTab]);

  const tabsRef = useRef(tabs);
  const activeKeyRef = useRef(activeKey);
  tabsRef.current = tabs;
  activeKeyRef.current = activeKey;

  const syncRouteForTabKind = useCallback(
    (kind: 'test' | 'package') => {
      const target = kind === 'package' ? '/lab/packages' : '/lab/tests';
      if (!location.pathname.startsWith(target)) {
        navigate(target, { replace: true });
      }
    },
    [location.pathname, navigate],
  );

  // Sidebar navigates first; align the active tab before paint so header and panel stay in sync.
  useLayoutEffect(() => {
    if (id && id !== 'new') {
      return;
    }
    const wantKind = isPackagesRoute ? 'package' : 'test';
    const active = tabsRef.current.find((t) => t.key === activeKeyRef.current);
    if (active?.kind === wantKind) {
      return;
    }
    const matching = tabsRef.current.filter((t) => t.kind === wantKind);
    if (matching.length > 0) {
      setActiveKey(matching[matching.length - 1].key);
    } else {
      addTab(wantKind);
    }
  }, [id, isPackagesRoute, addTab, setActiveKey]);

  const onActiveTabChange = (key: string) => {
    setActiveKey(key);
    const tab = tabs.find((t) => t.key === key);
    if (tab) {
      syncRouteForTabKind(tab.kind);
    }
  };

  const workspaceKind = activeTab?.kind ?? (isPackagesRoute ? 'package' : 'test');
  const [listMode, setListMode] = useState<LabBrowseListMode>(
    isPackagesRoute ? 'packages' : 'tests',
  );

  useEffect(() => {
    setListMode(isPackagesRoute ? 'packages' : 'tests');
  }, [isPackagesRoute]);
  const activeTestId = activeTab?.kind === 'test' ? activeTab.testId : undefined;
  const activePackageId = activeTab?.kind === 'package' ? activeTab.packageId : undefined;

  const tabBarItems = tabs.map((tab) => ({
    key: tab.key,
    label: tab.label,
    closable: tabs.length > 1 || tab.dirty,
  }));

  const onTabEdit = (targetKey: string | unknown, action: 'add' | 'remove') => {
    if (action === 'add') {
      const kind = activeTab?.kind ?? (isPackagesRoute ? 'package' : 'test');
      addTab(kind);
      syncRouteForTabKind(kind);
    } else if (typeof targetKey === 'string') {
      removeTab(targetKey);
    }
  };

  return (
    <>
      <PageHeader
        title={workspaceKind === 'package' ? 'Lab packages' : 'Lab tests'}
        subtitle="Form on the left; browse and search tests or packages on the right."
        breadcrumbs={[
          { title: 'Lab' },
          { title: workspaceKind === 'package' ? 'Package' : 'Test' },
        ]}
      />
      <Card className="billing-workspace-card" styles={{ body: { paddingTop: 12 } }}>
        <div className="registration-workspace-toolbar">
          <Typography.Text type="secondary">
            Use <strong>+</strong> on the tab bar or the buttons to add a test or package tab in the same
            row.
          </Typography.Text>
          <Space wrap>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                addTab('test');
                syncRouteForTabKind('test');
              }}
            >
              New test
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                addTab('package');
                syncRouteForTabKind('package');
              }}
            >
              New package
            </Button>
          </Space>
        </div>
        <Tabs
          type="editable-card"
          activeKey={activeKey}
          onChange={onActiveTabChange}
          onEdit={onTabEdit}
          items={tabBarItems}
          className="billing-workspace-tabs"
        />
        <div className="registration-desk-layout lab-tests-desk-layout">
          <div className="lab-test-tab-panels">
            {tabs.map((tab) => (
              <div key={tab.key} className="billing-tab-panel" hidden={tab.key !== activeKey}>
                {tab.kind === 'test' ? (
                  <LabTestFormPanel
                    testId={tab.testId}
                    autoFocusName={!tab.testId && tab.key === activeKey}
                    onTitleChange={(title, dirty) => handleTitleChange(tab.key, title, dirty)}
                    onSuccess={(test, action) => {
                      if (action === 'created') {
                        closeTabAfterSuccess(tab.key);
                      } else {
                        updateTabAfterSave(tab.key, {
                          testId: test.id,
                          dirty: false,
                          label: test.name,
                        });
                      }
                    }}
                    onDeleted={() => closeTabAfterSuccess(tab.key)}
                  />
                ) : (
                  <LabPackagePanel
                    packageId={tab.packageId}
                    autoFocusName={!tab.packageId && tab.key === activeKey}
                    onTitleChange={(title, dirty) => handleTitleChange(tab.key, title, dirty)}
                    onSuccess={(pkg) => {
                      updateTabAfterSave(tab.key, {
                        packageId: pkg.id,
                        dirty: false,
                        label: pkg.name,
                      });
                    }}
                    onDeleted={() => closeTabAfterSuccess(tab.key)}
                  />
                )}
              </div>
            ))}
          </div>
          <LabWorkspaceBrowsePanel
            listMode={listMode}
            onListModeChange={setListMode}
            selectedTestId={activeTestId}
            selectedPackageId={activePackageId}
            onSelectTest={(testId) => {
              openTestInTab(testId);
              syncRouteForTabKind('test');
            }}
            onSelectPackage={(packageId) => {
              openPackageInTab(packageId);
              syncRouteForTabKind('package');
            }}
          />
        </div>
      </Card>
    </>
  );
}
