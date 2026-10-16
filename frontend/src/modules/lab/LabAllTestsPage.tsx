import { Card, Empty, Input, Segmented } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { apiClient } from '../../api/client';
import type { LabPackageRecord, LabTestRecord, Paginated } from '../../api/types/models';
import { PageHeader } from '../../components/PageHeader';
import { ErrorBlock, LoadingBlock } from '../../components/QueryState';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
type AllTestsListMode = 'tests' | 'packages' | 'report-order';
import { LabPackageCatalogCard } from './LabPackageCatalogCard';
import { LabReportCatalogOrderPanel } from './LabReportCatalogOrderPanel';
import { LabTestFullFormDisplay } from './LabTestFullFormDisplay';

export function LabAllTestsPage() {
  const [listMode, setListMode] = useState<AllTestsListMode>('tests');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);

  const testsQuery = useQuery({
    queryKey: ['lab-tests', 'all-forms', debouncedSearch],
    enabled: listMode === 'tests',
    queryFn: async () => {
      const { data: res } = await apiClient.get<Paginated<LabTestRecord>>('/lab/tests/', {
        params: { search: debouncedSearch || undefined, page_size: 200 },
      });
      return res.results;
    },
  });

  const packagesQuery = useQuery({
    queryKey: ['lab-packages', 'all-forms', debouncedSearch],
    enabled: listMode === 'packages',
    queryFn: async () => {
      const { data: res } = await apiClient.get<Paginated<LabPackageRecord>>('/lab/packages/', {
        params: { search: debouncedSearch || undefined, page_size: 200 },
      });
      return res.results;
    },
  });

  const renderList = () => {
    if (listMode === 'report-order') {
      return <LabReportCatalogOrderPanel />;
    }
    if (listMode === 'tests') {
      if (testsQuery.isLoading) {
        return <LoadingBlock />;
      }
      if (testsQuery.isError) {
        return <ErrorBlock message="Could not load tests" />;
      }
      const tests = testsQuery.data ?? [];
      if (tests.length === 0) {
        return <Empty description="No tests found" />;
      }
      return (
        <div className="lab-all-tests-scroll">
          {tests.map((test) => (
            <LabTestFullFormDisplay key={test.id} test={test} />
          ))}
        </div>
      );
    }

    if (packagesQuery.isLoading) {
      return <LoadingBlock />;
    }
    if (packagesQuery.isError) {
      return <ErrorBlock message="Could not load packages" />;
    }
    const packages = packagesQuery.data ?? [];
    if (packages.length === 0) {
      return <Empty description="No packages found" />;
    }
    return (
      <div className="lab-all-tests-scroll lab-all-tests-scroll--packages">
        {packages.map((pkg) => (
          <LabPackageCatalogCard key={pkg.id} package={pkg} />
        ))}
      </div>
    );
  };

  return (
    <>
      <PageHeader
        title="All tests"
        subtitle="Preview layouts, arrange departments and test order for patient reports, or browse packages."
        breadcrumbs={[{ title: 'Lab' }, { title: 'All tests' }]}
      />
      <Card className="billing-workspace-card" styles={{ body: { paddingTop: 12 } }}>
        <div className="lab-all-tests-page">
          <div className="lab-all-tests-toolbar">
            <Segmented
              value={listMode}
              onChange={(value) => {
                setListMode(value as AllTestsListMode);
                setSearch('');
              }}
              options={[
                { label: 'Tests', value: 'tests' },
                { label: 'Report order', value: 'report-order' },
                { label: 'Packages', value: 'packages' },
              ]}
            />
            {listMode !== 'report-order' ? (
              <Input
                className="lab-all-tests-search"
                placeholder={
                  listMode === 'tests' ? 'Search test name or code' : 'Search package name'
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                allowClear
              />
            ) : null}
          </div>
          {renderList()}
        </div>
      </Card>
    </>
  );
}
