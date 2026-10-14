import { DeleteOutlined } from '@ant-design/icons';
import {
  AutoComplete,
  Button,
  Card,
  Input,
  InputNumber,
  Popconfirm,
  Space,
  Table,
  Typography,
  message,
} from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { AxiosError } from 'axios';

import { apiClient } from '../../api/client';
import type { LabPackageRecord, LabTestRecord, Paginated } from '../../api/types/models';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { formatMoney } from '../patients/patientRegistrationSchema';
import { ErrorBlock, LoadingBlock } from '../../components/QueryState';

type PackageLine = {
  key: string;
  testId: number;
  name: string;
  code: string;
  default_rate: number;
};

function formatMoneyInr(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
}

export type LabPackagePanelProps = {
  packageId?: number;
  autoFocusName?: boolean;
  onTitleChange?: (title: string, dirty: boolean) => void;
  onSuccess?: (pkg: LabPackageRecord, action: 'created' | 'updated') => void;
  onDeleted?: () => void;
};

export function LabPackagePanel({
  packageId,
  autoFocusName,
  onTitleChange,
  onSuccess,
  onDeleted,
}: LabPackagePanelProps) {
  const isEdit = Boolean(packageId);
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [packageAmount, setPackageAmount] = useState<number>(0);
  const [lines, setLines] = useState<PackageLine[]>([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['lab-package', packageId],
    enabled: isEdit,
    queryFn: async () => (await apiClient.get<LabPackageRecord>(`/lab/packages/${packageId}/`)).data,
  });

  const testsQuery = useQuery({
    queryKey: ['lab-tests', 'package-picker', debouncedSearch],
    queryFn: async () => {
      const { data: res } = await apiClient.get<Paginated<LabTestRecord>>('/lab/tests/', {
        params: { search: debouncedSearch || undefined, page_size: 20 },
      });
      return res.results;
    },
  });

  const selectedTestIds = useMemo(() => new Set(lines.map((l) => l.testId)), [lines]);

  const testOptions = useMemo(
    () =>
      (testsQuery.data ?? []).map((test) => {
        const already = selectedTestIds.has(test.id);
        return {
          value: String(test.id),
          label: already
            ? `${test.name} (already added)`
            : `${test.name}${test.code ? ` (${test.code})` : ''} — ${formatMoney(Number(test.default_rate))}`,
          test,
          disabled: already,
        };
      }),
    [testsQuery.data, selectedTestIds],
  );

  const testsSubtotal = useMemo(
    () => lines.reduce((sum, row) => sum + row.default_rate, 0),
    [lines],
  );

  useEffect(() => {
    if (data) {
      setName(data.name);
      setPackageAmount(Number(data.package_amount));
      setLines(
        data.items.map((item) => ({
          key: `item-${item.id}`,
          testId: item.test,
          name: item.test_detail?.name ?? `Test ${item.test}`,
          code: item.test_detail?.code ?? '',
          default_rate: Number(item.test_detail?.default_rate ?? 0),
        })),
      );
    }
  }, [data]);

  const onTitleChangeRef = useRef(onTitleChange);
  onTitleChangeRef.current = onTitleChange;
  const lastTitleReport = useRef<{ title: string; dirty: boolean } | null>(null);

  const hasDraft =
    name.trim() !== '' || lines.length > 0 || packageAmount > 0 || search.trim() !== '';

  useEffect(() => {
    const title = name.trim();
    const dirty = hasDraft;
    const prev = lastTitleReport.current;
    if (prev && prev.title === title && prev.dirty === dirty) {
      return;
    }
    lastTitleReport.current = { title, dirty };
    onTitleChangeRef.current?.(title, dirty);
  }, [name, hasDraft]);

  const addTest = (test: LabTestRecord) => {
    if (lines.some((l) => l.testId === test.id)) {
      message.warning(`"${test.name}" is already in this package.`);
      return;
    }
    setLines((prev) => [
      ...prev,
      {
        key: `test-${test.id}-${Date.now()}`,
        testId: test.id,
        name: test.name,
        code: test.code ?? '',
        default_rate: Number(test.default_rate),
      },
    ]);
    setSearch('');
  };

  const resetForm = () => {
    setName('');
    setPackageAmount(0);
    setLines([]);
    setSearch('');
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) {
        throw new Error('Package name is required');
      }
      if (lines.length === 0) {
        throw new Error('Add at least one test');
      }
      const payload = {
        name: name.trim(),
        package_amount: packageAmount,
        items: lines.map((row) => ({ test: row.testId })),
      };
      if (isEdit && packageId) {
        const { data: updated } = await apiClient.patch<LabPackageRecord>(
          `/lab/packages/${packageId}/`,
          payload,
        );
        return updated;
      }
      const { data: created } = await apiClient.post<LabPackageRecord>('/lab/packages/', payload);
      return created;
    },
    onSuccess: (pkg) => {
      message.success(isEdit ? 'Package saved' : 'Package created');
      void queryClient.invalidateQueries({ queryKey: ['lab-packages'] });
      if (pkg.id) {
        void queryClient.invalidateQueries({ queryKey: ['lab-package', pkg.id] });
      }
      onSuccess?.(pkg, isEdit ? 'updated' : 'created');
    },
    onError: (error: Error) => {
      const axiosError = error as AxiosError<Record<string, unknown>>;
      const data = axiosError.response?.data;
      if (data && typeof data === 'object') {
        const detail = data.detail;
        if (typeof detail === 'string') {
          message.error(detail);
          return;
        }
        const firstField = Object.values(data).find((v) => typeof v === 'string' || Array.isArray(v));
        if (typeof firstField === 'string') {
          message.error(firstField);
          return;
        }
        if (Array.isArray(firstField) && firstField.length > 0) {
          message.error(String(firstField[0]));
          return;
        }
      }
      message.error('Could not save package');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!packageId) {
        return;
      }
      await apiClient.delete(`/lab/packages/${packageId}/`);
    },
    onSuccess: () => {
      message.success('Package removed');
      void queryClient.invalidateQueries({ queryKey: ['lab-packages'] });
      onDeleted?.();
    },
  });

  if (isEdit && isLoading) {
    return <LoadingBlock />;
  }
  if (isEdit && isError) {
    return <ErrorBlock message="Failed to load package" />;
  }

  return (
    <div className="lab-package-panel">
      <div className="billing-form-section">
        <Typography.Text strong className="billing-form-section-title">Package</Typography.Text>
        <div className="lab-test-details-grid">
          <div className="lab-test-details-grid-span">
            <Typography.Text type="secondary" className="billing-grid-label">Package name</Typography.Text>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Executive health check"
              autoFocus={autoFocusName}
            />
          </div>
          <div>
            <Typography.Text type="secondary" className="billing-grid-label">Package amount (₹)</Typography.Text>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={10}
              value={packageAmount}
              onChange={(val) => setPackageAmount(Number(val) || 0)}
            />
          </div>
        </div>
      </div>

      <div className="billing-form-section">
        <Typography.Text strong className="billing-form-section-title">Add test</Typography.Text>
        <AutoComplete
          style={{ width: '100%', maxWidth: 520 }}
          value={search}
          options={testOptions}
          onSearch={setSearch}
          onSelect={(value) => {
            const match = testOptions.find((o) => o.value === value);
            if (match) {
              addTest(match.test);
            }
          }}
          placeholder="Search test name or code"
          notFoundContent={testsQuery.isLoading ? 'Loading…' : 'No tests found'}
        />
      </div>

      <Table
        className="billing-tests-table"
        size="small"
        rowKey="key"
        dataSource={lines}
        pagination={false}
        title={() => <Typography.Text strong>Tests in package</Typography.Text>}
        locale={{ emptyText: 'No tests — search and add tests above' }}
        footer={() => (
          <div className="lab-package-footer">
            <Typography.Text type="secondary">
              Sum of individual test rates: {formatMoneyInr(testsSubtotal)}
            </Typography.Text>
          </div>
        )}
        columns={[
          { title: '#', width: 48, render: (_, __, index) => index + 1 },
          { title: 'Test', dataIndex: 'name' },
          { title: 'Code', dataIndex: 'code', width: 100 },
          {
            title: 'Test rate',
            width: 120,
            render: (_, row) => formatMoneyInr(row.default_rate),
          },
          {
            title: '',
            width: 48,
            render: (_, row) => (
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                aria-label="Remove test"
                onClick={() => setLines((prev) => prev.filter((l) => l.key !== row.key))}
              />
            ),
          },
        ]}
      />

      <Space className="lab-test-form-actions" wrap>
        <Button
          type="primary"
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
          disabled={!name.trim() || lines.length === 0}
        >
          Save
        </Button>
        <Popconfirm
          title="Discard this package?"
          description="Package name, tests, and amount will be cleared."
          okText="Discard"
          cancelText="Keep editing"
          onConfirm={resetForm}
          disabled={!hasDraft || saveMutation.isPending}
        >
          <Button disabled={!hasDraft || saveMutation.isPending}>Cancel</Button>
        </Popconfirm>
        {isEdit && packageId && (
          <Popconfirm
            title="Remove this package?"
            description="The package will be deactivated (soft delete)."
            onConfirm={() => deleteMutation.mutate()}
          >
            <Button danger loading={deleteMutation.isPending}>Delete</Button>
          </Popconfirm>
        )}
      </Space>
    </div>
  );
}

export function LabPackageListPanel({
  selectedPackageId,
  onSelectPackage,
  search = '',
  embedded = false,
}: {
  selectedPackageId?: number;
  onSelectPackage: (id: number) => void;
  search?: string;
  embedded?: boolean;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['lab-packages', 'panel', search],
    queryFn: async () => {
      const { data: res } = await apiClient.get<Paginated<LabPackageRecord>>('/lab/packages/', {
        params: { search: search || undefined, page_size: 50 },
      });
      return res.results;
    },
  });

  if (isLoading) {
    return <LoadingBlock />;
  }
  if (isError) {
    return <ErrorBlock message="Could not load packages" />;
  }

  const list = (
    <div className="doctor-list-panel-scroll">
      {(data ?? []).length === 0 ? (
        <Typography.Text type="secondary">No packages found</Typography.Text>
      ) : null}
      {(data ?? []).map((pkg) => (
          <Card
            key={pkg.id}
            size="small"
            hoverable
            className={`doctor-list-card${selectedPackageId === pkg.id ? ' doctor-list-card--selected' : ''}`}
            onClick={() => onSelectPackage(pkg.id)}
          >
            <Typography.Text strong className="doctor-list-card-name">{pkg.name}</Typography.Text>
            <Typography.Text type="secondary" className="doctor-list-card-meta">
              {pkg.items.length} test{pkg.items.length === 1 ? '' : 's'}
            </Typography.Text>
            <Typography.Text type="secondary" className="doctor-list-card-meta">
              {formatMoney(Number(pkg.package_amount))}
            </Typography.Text>
          </Card>
        ))}
    </div>
  );

  if (embedded) {
    return list;
  }

  return (
    <aside className="doctor-list-panel" aria-label="Lab packages">
      <Typography.Title level={5} style={{ marginTop: 0 }}>Packages</Typography.Title>
      {list}
    </aside>
  );
}
