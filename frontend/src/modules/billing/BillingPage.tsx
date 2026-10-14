import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, Modal, Tabs, Typography } from 'antd';
import { useCallback, useState } from 'react';

import { PageHeader } from '../../components/PageHeader';
import { RecentLabBillsSidebar } from '../lab/RecentLabBillsSidebar';
import { BillingPanel } from './BillingPanel';

type BillingTab = {
  key: string;
  defaultLabel: string;
  label: string;
  dirty: boolean;
  editBillId?: number;
};

let tabCounter = 0;

function createTab(partial?: Partial<BillingTab>): BillingTab {
  tabCounter += 1;
  const key = partial?.key ?? `bill-${Date.now()}-${tabCounter}`;
  const defaultLabel = partial?.defaultLabel ?? `Bill ${tabCounter}`;
  return {
    key,
    defaultLabel,
    label: partial?.label ?? defaultLabel,
    dirty: partial?.dirty ?? false,
    editBillId: partial?.editBillId,
  };
}

export function BillingPage() {
  const [tabs, setTabs] = useState<BillingTab[]>(() => [createTab()]);
  const [activeKey, setActiveKey] = useState(() => tabs[0].key);
  const [selectedRecentBillId, setSelectedRecentBillId] = useState<number | null>(null);

  const addTab = useCallback(() => {
    const tab = createTab();
    setTabs((prev) => [...prev, tab]);
    setActiveKey(tab.key);
  }, []);

  const handleBillCancelled = useCallback(
    (billId: number) => {
      setSelectedRecentBillId((current) => (current === billId ? null : current));
      setTabs((prev) => {
        const tabToClose = prev.find((t) => t.editBillId === billId);
        if (!tabToClose) {
          return prev;
        }
        const next = prev.filter((t) => t.key !== tabToClose.key);
        if (next.length === 0) {
          const fresh = createTab();
          setActiveKey(fresh.key);
          return [fresh];
        }
        if (activeKey === tabToClose.key) {
          setActiveKey(next[next.length - 1].key);
        }
        return next;
      });
    },
    [activeKey],
  );

  const openBillForEdit = useCallback(
    (billId: number) => {
      setSelectedRecentBillId(billId);
      const existing = tabs.find((t) => t.editBillId === billId);
      if (existing) {
        setActiveKey(existing.key);
        return;
      }
      const tab = createTab({ editBillId: billId, defaultLabel: 'Edit bill' });
      setTabs((prev) => [...prev, tab]);
      setActiveKey(tab.key);
    },
    [tabs],
  );

  const removeTab = useCallback(
    (targetKey: string) => {
      const tab = tabs.find((t) => t.key === targetKey);
      const doRemove = () => {
        setTabs((prev) => {
          const next = prev.filter((t) => t.key !== targetKey);
          if (next.length === 0) {
            const fresh = createTab();
            setActiveKey(fresh.key);
            return [fresh];
          }
          if (activeKey === targetKey) {
            setActiveKey(next[next.length - 1].key);
          }
          return next;
        });
      };
      if (tab?.dirty) {
        Modal.confirm({
          title: 'Close this bill?',
          content: 'You have unsaved data on this tab.',
          okText: 'Close tab',
          okType: 'danger',
          okButtonProps: { size: 'middle' },
          cancelButtonProps: { size: 'middle' },
          onOk: doRemove,
        });
      } else {
        doRemove();
      }
    },
    [tabs, activeKey],
  );

  const handleTitleChange = useCallback((key: string, title: string, dirty: boolean) => {
    setTabs((prev) => {
      const current = prev.find((t) => t.key === key);
      if (!current) {
        return prev;
      }
      const base = title.trim() || current.defaultLabel;
      const label = dirty ? `${base} *` : base;
      if (current.label === label && current.dirty === dirty) {
        return prev;
      }
      return prev.map((t) => (t.key === key ? { ...t, dirty, label } : t));
    });
  }, []);

  const closeTabAfterSuccess = useCallback(
    (tabKey: string) => {
      setTabs((prev) => {
        const next = prev.filter((t) => t.key !== tabKey);
        if (next.length === 0) {
          const fresh = createTab();
          setActiveKey(fresh.key);
          return [fresh];
        }
        if (activeKey === tabKey) {
          setActiveKey(next[next.length - 1].key);
        }
        return next;
      });
    },
    [activeKey],
  );

  const tabBarItems = tabs.map((tab) => ({
    key: tab.key,
    label: tab.label,
    closable: tabs.length > 1 || tab.dirty,
  }));

  return (
    <>
      <PageHeader
        title="Billing"
        subtitle="Bill on the left; use Edit on a recent bill to open it in a new tab."
        breadcrumbs={[{ title: 'Lab' }, { title: 'Billing' }]}
      />
      <div className="registration-desk-layout billing-desk-layout">
        <Card className="billing-workspace-card billing-workspace-main" styles={{ body: { paddingTop: 12 } }}>
          <div className="registration-workspace-toolbar">
            <Typography.Text type="secondary">
              Use <strong>+</strong> on the tab bar or the button below to start another bill.
            </Typography.Text>
            <Button type="primary" icon={<PlusOutlined />} onClick={addTab}>
              New tab
            </Button>
          </div>
          <Tabs
            type="editable-card"
            activeKey={activeKey}
            onChange={setActiveKey}
            onEdit={(targetKey, action) => {
              if (action === 'add') {
                addTab();
              } else if (typeof targetKey === 'string') {
                removeTab(targetKey);
              }
            }}
            items={tabBarItems}
            className="billing-workspace-tabs"
          />
          <div className="billing-tab-panels">
            {tabs.map((tab) => (
              <div key={tab.key} className="billing-tab-panel" hidden={tab.key !== activeKey}>
                <BillingPanel
                  billId={tab.editBillId}
                  onTitleChange={(title, dirty) => handleTitleChange(tab.key, title, dirty)}
                  onSuccess={() => closeTabAfterSuccess(tab.key)}
                />
              </div>
            ))}
          </div>
        </Card>
        <RecentLabBillsSidebar
          title="Recent bills"
          selectedBillId={selectedRecentBillId}
          onSelectBill={setSelectedRecentBillId}
          onEditBill={openBillForEdit}
          onBillCancelled={handleBillCancelled}
          emptyDescription="No bills yet — save a bill in this workspace first."
        />
      </div>
    </>
  );
}
