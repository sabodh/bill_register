import { AutoComplete, Button, InputNumber, Space, Table, Typography, message } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { apiClient } from '../../api/client';
import type { BillingItem, Paginated } from '../../api/types/models';
import { PageHeader } from '../../components/PageHeader';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

type GridLine = {
  key: string;
  billing_item: number | null;
  description: string;
  quantity: number;
  unit_price: number;
};

function lineAmount(line: GridLine) {
  return Number((line.quantity * line.unit_price).toFixed(2));
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
}

export function BillingPage() {
  const [search, setSearch] = useState('');
  const [lines, setLines] = useState<GridLine[]>([]);
  const debouncedSearch = useDebouncedValue(search, 300);

  const itemsQuery = useQuery({
    queryKey: ['billing-items', debouncedSearch],
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<BillingItem>>('/billing/items/', {
        params: { search: debouncedSearch || undefined, page_size: 20 },
      });
      return data.results;
    },
  });

  const options = useMemo(
    () =>
      (itemsQuery.data ?? []).map((item) => ({
        value: String(item.id),
        label: `${item.name} — ${formatMoney(Number(item.default_rate))}`,
        item,
      })),
    [itemsQuery.data],
  );

  const addLineFromItem = (item: BillingItem) => {
    setLines((prev) => [
      ...prev,
      {
        key: `row-${item.id}-${Date.now()}`,
        billing_item: item.id,
        description: item.name,
        quantity: 1,
        unit_price: Number(item.default_rate),
      },
    ]);
    setSearch('');
  };

  const updateLine = (key: string, patch: Partial<GridLine>) => {
    setLines((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  const removeLine = (key: string) => {
    setLines((prev) => prev.filter((row) => row.key !== key));
  };

  const total = useMemo(() => lines.reduce((sum, row) => sum + lineAmount(row), 0), [lines]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (lines.length === 0) {
        throw new Error('Add at least one line');
      }
      await apiClient.post('/billing/bills/', {
        lines: lines.map((row) => ({
          billing_item: row.billing_item,
          description: row.description,
          quantity: row.quantity,
          unit_price: row.unit_price,
        })),
      });
    },
    onSuccess: () => {
      message.success('Bill saved');
      setLines([]);
    },
    onError: () => message.error('Could not save bill'),
  });

  return (
    <>
      <PageHeader
        title="Billing"
        subtitle="Add bill lines with autocomplete (like a product picker + grid)"
        breadcrumbs={[{ title: 'Billing' }]}
        extra={
          <Button
            type="primary"
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
            disabled={lines.length === 0}
          >
            Save bill
          </Button>
        }
      />

      <div
        style={{
          background: '#fff',
          padding: '1rem 1.25rem',
          borderRadius: 8,
          marginBottom: 16,
          border: '1px solid #f0f0f0',
        }}
      >
        <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
          Add item
        </Typography.Text>
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <AutoComplete
            style={{ width: '100%', maxWidth: 520 }}
            options={options}
            value={search}
            onSearch={setSearch}
            onSelect={(value) => {
              const match = options.find((o) => o.value === value);
              if (match) {
                addLineFromItem(match.item);
              }
            }}
            placeholder="Search product / service name or code"
            notFoundContent={itemsQuery.isLoading ? 'Loading…' : 'No items found'}
            onFocus={() => itemsQuery.refetch()}
          />
        </Space>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0, marginTop: 8 }}>
          Pick a row from the list to add it to the grid below. Change quantity to recalculate line
          amount.
        </Typography.Paragraph>
      </div>

      <Table
        rowKey="key"
        dataSource={lines}
        pagination={false}
        locale={{ emptyText: 'No lines yet — search and select an item above' }}
        footer={() => (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() =>
                setLines((prev) => [
                  ...prev,
                  {
                    key: `manual-${Date.now()}`,
                    billing_item: null,
                    description: 'Custom item',
                    quantity: 1,
                    unit_price: 0,
                  },
                ])
              }
            >
              Add empty row
            </Button>
            <Typography.Title level={5} style={{ margin: 0 }}>
              Total: {formatMoney(total)}
            </Typography.Title>
          </div>
        )}
        columns={[
          {
            title: '#',
            width: 48,
            render: (_, __, index) => index + 1,
          },
          {
            title: 'Item',
            dataIndex: 'description',
            render: (text, record) => (
              <input
                value={text}
                onChange={(e) => updateLine(record.key, { description: e.target.value })}
                style={{ width: '100%', border: '1px solid #d9d9d9', borderRadius: 6, padding: '4px 8px' }}
              />
            ),
          },
          {
            title: 'Qty',
            dataIndex: 'quantity',
            width: 120,
            render: (qty, record) => (
              <InputNumber
                min={0.01}
                step={1}
                value={qty}
                onChange={(val) => updateLine(record.key, { quantity: Number(val) || 1 })}
              />
            ),
          },
          {
            title: 'Rate',
            dataIndex: 'unit_price',
            width: 140,
            render: (rate, record) => (
              <InputNumber
                min={0}
                step={0.01}
                value={rate}
                onChange={(val) => updateLine(record.key, { unit_price: Number(val) || 0 })}
              />
            ),
          },
          {
            title: 'Amount',
            width: 140,
            render: (_, record) => formatMoney(lineAmount(record)),
          },
          {
            title: '',
            width: 56,
            render: (_, record) => (
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                aria-label="Delete row"
                onClick={() => removeLine(record.key)}
              />
            ),
          },
        ]}
      />
    </>
  );
}
