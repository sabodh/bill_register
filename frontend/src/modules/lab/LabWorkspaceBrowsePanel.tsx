import { Input, Segmented, Typography } from 'antd';
import { useState } from 'react';

import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { LabPackageListPanel } from './LabPackagePanel';
import { LabTestListPanel } from './LabTestFormPanel';

export type LabBrowseListMode = 'tests' | 'packages';

type LabWorkspaceBrowsePanelProps = {
  listMode: LabBrowseListMode;
  onListModeChange: (mode: LabBrowseListMode) => void;
  selectedTestId?: number;
  selectedPackageId?: number;
  onSelectTest: (id: number) => void;
  onSelectPackage: (id: number) => void;
  search?: string;
  onSearchChange?: (value: string) => void;
};

export function LabWorkspaceBrowsePanel({
  listMode,
  onListModeChange,
  selectedTestId,
  selectedPackageId,
  onSelectTest,
  onSelectPackage,
  search: controlledSearch,
  onSearchChange,
}: LabWorkspaceBrowsePanelProps) {
  const [internalSearch, setInternalSearch] = useState('');
  const search = controlledSearch ?? internalSearch;
  const setSearch = onSearchChange ?? setInternalSearch;
  const debouncedSearch = useDebouncedValue(search, 300);

  return (
    <aside className="lab-workspace-browse-panel" aria-label="Browse lab tests and packages">
      <div className="lab-workspace-browse-toolbar">
        <Typography.Title level={5} style={{ margin: 0 }}>Browse</Typography.Title>
        <Segmented
          value={listMode}
          onChange={(value) => {
            onListModeChange(value as LabBrowseListMode);
            setSearch('');
          }}
          options={[
            { label: 'Tests', value: 'tests' },
            { label: 'Packages', value: 'packages' },
          ]}
        />
        <Input
          placeholder={listMode === 'tests' ? 'Search test name or code' : 'Search package name'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
        />
      </div>
      {listMode === 'tests' ? (
        <LabTestListPanel
          embedded
          search={debouncedSearch}
          selectedTestId={selectedTestId}
          onSelectTest={onSelectTest}
        />
      ) : (
        <LabPackageListPanel
          embedded
          search={debouncedSearch}
          selectedPackageId={selectedPackageId}
          onSelectPackage={onSelectPackage}
        />
      )}
    </aside>
  );
}
