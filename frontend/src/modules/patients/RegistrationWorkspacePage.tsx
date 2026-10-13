import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, Modal, Tabs, Typography } from 'antd';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { Patient } from '../../api/types/models';
import { PageHeader } from '../../components/PageHeader';
import { DoctorTokenBoard } from './DoctorTokenBoard';
import { PatientRegistrationPanel } from './PatientRegistrationPanel';

type RegistrationTab = {
  key: string;
  defaultLabel: string;
  label: string;
  dirty: boolean;
  patientId?: number;
};

let tabCounter = 0;

function createTab(partial?: Partial<RegistrationTab>): RegistrationTab {
  tabCounter += 1;
  const key = partial?.key ?? `reg-${Date.now()}-${tabCounter}`;
  const defaultLabel = partial?.defaultLabel ?? `Registration ${tabCounter}`;
  return {
    key,
    defaultLabel,
    label: partial?.label ?? defaultLabel,
    dirty: partial?.dirty ?? false,
    patientId: partial?.patientId,
  };
}

export function RegistrationWorkspacePage() {
  const navigate = useNavigate();
  const [tabs, setTabs] = useState<RegistrationTab[]>(() => [createTab()]);
  const [activeKey, setActiveKey] = useState(() => tabs[0].key);
  const [pendingDoctorByTab, setPendingDoctorByTab] = useState<Record<string, number>>({});
  const [selectedDoctorByTab, setSelectedDoctorByTab] = useState<Record<string, number | null>>({});

  const addTab = useCallback(() => {
    const tab = createTab();
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
          title: 'Close this registration?',
          content: 'You have unsaved data on this tab.',
          okText: 'Close tab',
          okType: 'danger',
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

  const closeTabAfterSuccess = useCallback((tabKey: string) => {
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
  }, [activeKey]);

  const handleRegistrationSuccess = useCallback(
    (tabKey: string, _patient: Patient) => {
      closeTabAfterSuccess(tabKey);
    },
    [closeTabAfterSuccess],
  );

  const tabBarItems = tabs.map((tab) => ({
    key: tab.key,
    label: tab.label,
    closable: tabs.length > 1 || tab.dirty,
  }));

  return (
    <>
      <PageHeader
        title="Registration desk"
        subtitle="Open multiple tabs to register patients in parallel while waiting for details."
        breadcrumbs={[{ title: 'Registration' }, { title: 'Desk' }]}
        extra={
          <Button type="default" onClick={() => navigate('/patients')}>
            Patient list
          </Button>
        }
      />
      <Card className="registration-workspace-card" styles={{ body: { paddingTop: 12 } }}>
        <div className="registration-workspace-toolbar">
          <Typography.Text type="secondary">
            Use <strong>+</strong> on the tab bar or the button below to start another registration.
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
          className="registration-workspace-tabs"
        />
        <div className="registration-desk-layout">
          <div className="registration-tab-panels">
            {tabs.map((tab, index) => (
              <div
                key={tab.key}
                className="registration-tab-panel"
                hidden={tab.key !== activeKey}
              >
                <PatientRegistrationPanel
                  patientId={tab.patientId}
                  autoFocusName={tab.key === activeKey && index === 0}
                  pendingDoctorId={pendingDoctorByTab[tab.key] ?? null}
                  onPendingDoctorConsumed={() =>
                    setPendingDoctorByTab((prev) => {
                      const next = { ...prev };
                      delete next[tab.key];
                      return next;
                    })
                  }
                  onDoctorChange={(doctorId) =>
                    setSelectedDoctorByTab((prev) => ({ ...prev, [tab.key]: doctorId }))
                  }
                  onTitleChange={(title, dirty) => handleTitleChange(tab.key, title, dirty)}
                  onSuccess={(patient) => {
                    if (patient.doctor) {
                      setSelectedDoctorByTab((prev) => ({ ...prev, [tab.key]: patient.doctor }));
                    }
                    handleRegistrationSuccess(tab.key, patient);
                  }}
                />
              </div>
            ))}
          </div>
          <DoctorTokenBoard
            selectedDoctorId={selectedDoctorByTab[activeKey] ?? null}
            onSelectDoctor={(doctorId) => {
              setPendingDoctorByTab((prev) => ({ ...prev, [activeKey]: doctorId }));
              setSelectedDoctorByTab((prev) => ({ ...prev, [activeKey]: doctorId }));
            }}
          />
        </div>
      </Card>
    </>
  );
}
