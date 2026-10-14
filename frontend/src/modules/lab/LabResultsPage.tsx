import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, Modal, Tabs, Typography } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import type { LabResultBillSummary, Patient } from '../../api/types/models';
import { PatientSessionLookup } from '../../components/PatientSessionLookup';
import { PageHeader } from '../../components/PageHeader';
import { LabResultBillWorkspace } from './LabResultBillWorkspace';
import { RecentLabBillsSidebar } from './RecentLabBillsSidebar';

type ResultTab = {
  key: string;
  billId: number | null;
  defaultLabel: string;
  label: string;
  dirty: boolean;
};

let tabCounter = 0;

function patientFromBillSummary(bill: LabResultBillSummary): Patient {
  return {
    id: bill.patient,
    uhid: bill.patient_uhid,
    name: bill.patient_name,
    gender: 'O',
    age_years: null,
    phone: '',
    address: '',
    date_of_birth: null,
    file_number: '',
    doctor: null,
    doctor_detail: null,
    branch: 0,
    op_token: null,
    is_active: true,
  };
}

function createResultTab(partial?: Partial<ResultTab>): ResultTab {
  tabCounter += 1;
  const key = partial?.key ?? `result-${Date.now()}-${tabCounter}`;
  const defaultLabel = partial?.defaultLabel ?? `Bill ${tabCounter}`;
  return {
    key,
    billId: partial?.billId ?? null,
    defaultLabel,
    label: partial?.label ?? defaultLabel,
    dirty: partial?.dirty ?? false,
  };
}

export function LabResultsPage() {
  const [searchParams] = useSearchParams();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [tabs, setTabs] = useState<ResultTab[]>(() => [createResultTab()]);
  const [activeKey, setActiveKey] = useState(() => tabs[0].key);
  const [selectedRecentBillId, setSelectedRecentBillId] = useState<number | null>(null);

  const activeTab = tabs.find((t) => t.key === activeKey);
  const activeBillId = activeTab?.billId ?? null;

  useEffect(() => {
    const raw = searchParams.get('bill');
    if (!raw) {
      return;
    }
    const id = Number(raw);
    if (!Number.isFinite(id)) {
      return;
    }
    setTabs((prev) => {
      const first = prev[0];
      if (!first) {
        return [createResultTab({ billId: id })];
      }
      return prev.map((t, index) => (index === 0 ? { ...t, billId: id } : t));
    });
    setSelectedRecentBillId(id);
  }, [searchParams]);

  const openBillTab = useCallback(
    (billId: number) => {
      setSelectedRecentBillId(billId);
      const existing = tabs.find((t) => t.billId === billId);
      if (existing) {
        setActiveKey(existing.key);
        return;
      }
      const active = tabs.find((t) => t.key === activeKey);
      if (active && active.billId == null) {
        setTabs((prev) =>
          prev.map((t) =>
            t.key === activeKey ? { ...t, billId, label: 'Loading…', defaultLabel: 'Bill' } : t,
          ),
        );
        return;
      }
      const tab = createResultTab({ billId, defaultLabel: 'Bill', label: 'Loading…' });
      setTabs((prev) => [...prev, tab]);
      setActiveKey(tab.key);
    },
    [tabs, activeKey],
  );

  const addTab = useCallback(() => {
    const tab = createResultTab();
    setTabs((prev) => [...prev, tab]);
    setActiveKey(tab.key);
  }, []);

  const removeTab = useCallback(
    (targetKey: string) => {
      const tab = tabs.find((t) => t.key === targetKey);
      const doRemove = () => {
        setTabs((prev) => {
          const next = prev.filter((t) => t.key !== targetKey);
          if (next.length === 0) {
            const fresh = createResultTab();
            setActiveKey(fresh.key);
            return [fresh];
          }
          if (activeKey === targetKey) {
            setActiveKey(next[next.length - 1].key);
          }
          return next;
        });
        if (tab?.billId === selectedRecentBillId) {
          setSelectedRecentBillId(null);
        }
      };
      if (tab?.dirty) {
        Modal.confirm({
          title: 'Close this tab?',
          content: 'You have unsaved results on this tab.',
          okText: 'Close tab',
          okType: 'danger',
          onOk: doRemove,
        });
      } else {
        doRemove();
      }
    },
    [tabs, activeKey, selectedRecentBillId],
  );

  const handleBillCancelled = useCallback(
    (billId: number) => {
      setSelectedRecentBillId((current) => (current === billId ? null : current));
      setTabs((prev) => {
        const tabToClose = prev.find((t) => t.billId === billId);
        if (!tabToClose) {
          return prev;
        }
        const next = prev.filter((t) => t.key !== tabToClose.key);
        if (next.length === 0) {
          const fresh = createResultTab();
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

  const handlePatientChange = (patient: Patient | null) => {
    setSelectedPatient(patient);
    setSelectedRecentBillId(null);
    const fresh = createResultTab();
    setTabs([fresh]);
    setActiveKey(fresh.key);
  };

  const handleOpenBill = useCallback(
    (billId: number, bill?: LabResultBillSummary) => {
      if (bill) {
        setSelectedPatient((current) =>
          current?.id === bill.patient ? current : patientFromBillSummary(bill),
        );
      }
      openBillTab(billId);
    },
    [openBillTab],
  );

  const showWorkspace =
    selectedPatient != null || tabs.some((tab) => tab.billId != null);

  const tabBarItems = tabs.map((tab) => ({
    key: tab.key,
    label: tab.label,
    closable: tabs.length > 1 || tab.dirty || tab.billId != null,
  }));

  return (
    <>
      <PageHeader
        title="Lab results"
        subtitle="Open bills in tabs; use + for another bill. Save each tab before closing."
        breadcrumbs={[{ title: 'Lab' }, { title: 'Result' }]}
      />
      <div className="registration-desk-layout lab-results-desk-layout">
        <Card className="lab-results-detail billing-workspace-main" size="small" styles={{ body: { paddingTop: 12 } }}>
          <PatientSessionLookup value={selectedPatient} onChange={handlePatientChange} />
          {showWorkspace ? (
            <>
              <div className="registration-workspace-toolbar">
                <Typography.Text type="secondary">
                  Click a bill on the right to open it. Use <strong>+</strong> on the tab bar for another bill.
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
                    <LabResultBillWorkspace
                      billId={tab.billId}
                      onDirtyChange={(dirty) => {
                        setTabs((prev) =>
                          prev.map((t) => {
                            if (t.key !== tab.key) {
                              return t;
                            }
                            if (t.dirty === dirty) {
                              return t;
                            }
                            const base = t.defaultLabel.replace(/ \*$/, '');
                            return {
                              ...t,
                              dirty,
                              label: dirty ? `${base} *` : base,
                            };
                          }),
                        );
                      }}
                      onBillNumberChange={(billNumber) => {
                        setTabs((prev) =>
                          prev.map((t) => {
                            if (t.key !== tab.key) {
                              return t;
                            }
                            if (t.defaultLabel === billNumber) {
                              return t;
                            }
                            const label = t.dirty ? `${billNumber} *` : billNumber;
                            return { ...t, defaultLabel: billNumber, label };
                          }),
                        );
                      }}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <Typography.Paragraph type="secondary" style={{ marginTop: 12 }}>
              Select a patient above, or search by bill number on the right to open a bill.
            </Typography.Paragraph>
          )}
        </Card>
        <RecentLabBillsSidebar
          title="Patient bills"
          patientId={selectedPatient?.id ?? null}
          selectedBillId={selectedRecentBillId ?? activeBillId}
          onSelectBill={handleOpenBill}
          onEditBill={handleOpenBill}
          onBillCancelled={handleBillCancelled}
          resultWorklistTabs
          emptyDescription="No lab bills for this patient — save one under Lab → Billing."
          selectPatientHint="Select a patient on the left to load their bills."
        />
      </div>
    </>
  );
}
