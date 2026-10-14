import { Modal } from 'antd';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type LabWorkspaceTabKind = 'test' | 'package';

export type LabWorkspaceTab = {
  key: string;
  kind: LabWorkspaceTabKind;
  defaultLabel: string;
  label: string;
  dirty: boolean;
  testId?: number;
  packageId?: number;
};

let tabCounter = 0;

function isLoneEmptyWorkspaceTab(tabs: LabWorkspaceTab[]): boolean {
  if (tabs.length !== 1) {
    return false;
  }
  const only = tabs[0];
  return !only.dirty && only.testId == null && only.packageId == null;
}

function createTab(
  kind: LabWorkspaceTabKind,
  partial?: Partial<LabWorkspaceTab>,
): LabWorkspaceTab {
  tabCounter += 1;
  const key = partial?.key ?? `${kind}-${Date.now()}-${tabCounter}`;
  const defaultLabel =
    partial?.defaultLabel ??
    (kind === 'test' ? `Test ${tabCounter}` : `Package ${tabCounter}`);
  return {
    key,
    kind,
    defaultLabel,
    label: partial?.label ?? defaultLabel,
    dirty: partial?.dirty ?? false,
    testId: partial?.testId,
    packageId: partial?.packageId,
  };
}

type LabWorkspaceContextValue = {
  tabs: LabWorkspaceTab[];
  activeKey: string;
  setActiveKey: (key: string) => void;
  addTab: (kind: LabWorkspaceTabKind) => void;
  removeTab: (targetKey: string) => void;
  openTestInTab: (testId: number) => void;
  openPackageInTab: (packageId: number) => void;
  handleTitleChange: (key: string, title: string, dirty: boolean) => void;
  closeTabAfterSuccess: (tabKey: string) => void;
  updateTabAfterSave: (
    tabKey: string,
    update: Partial<Pick<LabWorkspaceTab, 'testId' | 'packageId' | 'label' | 'dirty'>>,
  ) => void;
  activeTab: LabWorkspaceTab | undefined;
};

const LabWorkspaceContext = createContext<LabWorkspaceContextValue | null>(null);

export function LabWorkspaceProvider({ children }: { children: ReactNode }) {
  const [tabs, setTabs] = useState<LabWorkspaceTab[]>(() => [createTab('test')]);
  const [activeKey, setActiveKey] = useState(() => tabs[0].key);

  const addTab = useCallback((kind: LabWorkspaceTabKind) => {
    const tab = createTab(kind);
    setTabs((prev) => [...prev, tab]);
    setActiveKey(tab.key);
  }, []);

  const openTestInTab = useCallback((testId: number) => {
    setTabs((prev) => {
      const existing = prev.find((t) => t.kind === 'test' && t.testId === testId);
      if (existing) {
        setActiveKey(existing.key);
        return prev;
      }
      if (isLoneEmptyWorkspaceTab(prev)) {
        const label = `Test #${testId}`;
        const updated: LabWorkspaceTab = {
          ...prev[0],
          kind: 'test',
          testId,
          packageId: undefined,
          label,
          defaultLabel: label,
          dirty: false,
        };
        setActiveKey(updated.key);
        return [updated];
      }
      const tab = createTab('test', { testId, defaultLabel: `Test #${testId}` });
      setActiveKey(tab.key);
      return [...prev, tab];
    });
  }, []);

  const openPackageInTab = useCallback((packageId: number) => {
    setTabs((prev) => {
      const existing = prev.find((t) => t.kind === 'package' && t.packageId === packageId);
      if (existing) {
        setActiveKey(existing.key);
        return prev;
      }
      if (isLoneEmptyWorkspaceTab(prev)) {
        const label = `Package #${packageId}`;
        const updated: LabWorkspaceTab = {
          ...prev[0],
          kind: 'package',
          packageId,
          testId: undefined,
          label,
          defaultLabel: label,
          dirty: false,
        };
        setActiveKey(updated.key);
        return [updated];
      }
      const tab = createTab('package', { packageId, defaultLabel: `Package #${packageId}` });
      setActiveKey(tab.key);
      return [...prev, tab];
    });
  }, []);

  const removeTab = useCallback(
    (targetKey: string) => {
      const tab = tabs.find((t) => t.key === targetKey);
      const doRemove = () => {
        setTabs((prev) => {
          const next = prev.filter((t) => t.key !== targetKey);
          if (next.length === 0) {
            const fresh = createTab(tab?.kind ?? 'test');
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
          title: tab.kind === 'package' ? 'Close this package?' : 'Close this test?',
          content: 'You have unsaved changes on this tab.',
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
        const closing = prev.find((t) => t.key === tabKey);
        const next = prev.filter((t) => t.key !== tabKey);
        if (next.length === 0) {
          const fresh = createTab(closing?.kind ?? 'test');
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

  const updateTabAfterSave = useCallback(
    (tabKey: string, update: Partial<Pick<LabWorkspaceTab, 'testId' | 'packageId' | 'label' | 'dirty'>>) => {
      setTabs((prev) => prev.map((t) => (t.key === tabKey ? { ...t, ...update } : t)));
    },
    [],
  );

  const activeTab = tabs.find((t) => t.key === activeKey);

  const value = useMemo(
    () => ({
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
    }),
    [
      tabs,
      activeKey,
      addTab,
      removeTab,
      openTestInTab,
      openPackageInTab,
      handleTitleChange,
      closeTabAfterSuccess,
      updateTabAfterSave,
      activeTab,
    ],
  );

  return <LabWorkspaceContext.Provider value={value}>{children}</LabWorkspaceContext.Provider>;
}

export function useLabWorkspace() {
  const ctx = useContext(LabWorkspaceContext);
  if (!ctx) {
    throw new Error('useLabWorkspace must be used within LabWorkspaceProvider');
  }
  return ctx;
}
