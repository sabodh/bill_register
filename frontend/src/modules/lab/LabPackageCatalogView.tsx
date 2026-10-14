import { Input, InputNumber, Table, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../../api/client';
import type { LabPackageRecord } from '../../api/types/models';
import { ErrorBlock, LoadingBlock } from '../../components/QueryState';
import { formatMoney } from '../patients/patientRegistrationSchema';

function formatMoneyInr(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
}

export function LabPackageCatalogView({
  packageId,
  package: packageRecord,
  hideHeader = false,
}: {
  packageId?: number;
  package?: LabPackageRecord;
  hideHeader?: boolean;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['lab-package', packageId],
    enabled: Boolean(packageId) && !packageRecord,
    queryFn: async () => (await apiClient.get<LabPackageRecord>(`/lab/packages/${packageId}/`)).data,
  });

  const resolved = packageRecord ?? data;

  if (!packageRecord && isLoading) {
    return <LoadingBlock />;
  }
  if (!resolved) {
    return <ErrorBlock message="Could not load package" />;
  }
  if (!packageRecord && isError) {
    return <ErrorBlock message="Could not load package" />;
  }

  const lines = resolved.items.map((item) => ({
    key: `item-${item.id}`,
    name: item.test_detail?.name ?? `Test ${item.test}`,
    code: item.test_detail?.code ?? '',
    default_rate: Number(item.test_detail?.default_rate ?? 0),
  }));

  const testsSubtotal = lines.reduce((sum, row) => sum + row.default_rate, 0);

  return (
    <div className="lab-catalog-view lab-package-panel">
      {!hideHeader && (
        <div className="billing-form-section">
          <Typography.Text strong className="billing-form-section-title">Package</Typography.Text>
          <div className="lab-test-details-grid">
            <div className="lab-test-details-grid-span">
              <Typography.Text type="secondary" className="billing-grid-label">Package name</Typography.Text>
              <Input value={resolved.name} readOnly />
            </div>
            <div>
              <Typography.Text type="secondary" className="billing-grid-label">Package amount (₹)</Typography.Text>
              <InputNumber
                style={{ width: '100%' }}
                value={Number(resolved.package_amount)}
                readOnly
                formatter={(v) => `${v}`}
              />
            </div>
          </div>
        </div>
      )}

      <Table
        className="billing-tests-table"
        size="small"
        rowKey="key"
        dataSource={lines}
        pagination={false}
        title={() => <Typography.Text strong>Tests in package</Typography.Text>}
        footer={() => (
          <div className="lab-package-footer">
            <Typography.Text type="secondary">
              Sum of individual test rates: {formatMoneyInr(testsSubtotal)}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
              Package amount: {formatMoney(Number(resolved.package_amount))}
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
        ]}
      />
    </div>
  );
}
