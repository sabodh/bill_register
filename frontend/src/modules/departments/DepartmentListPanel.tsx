import { Card, Empty, Input, Skeleton, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { apiClient } from '../../api/client';
import type { DepartmentRecord, Paginated } from '../../api/types/models';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

type DepartmentListPanelProps = {
  apiPath: string;
  queryKey: string;
  title: string;
  selectedId?: number;
  onSelect: (id: number) => void;
};

export function DepartmentListPanel({
  apiPath,
  queryKey,
  title,
  selectedId,
  onSelect,
}: DepartmentListPanelProps) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data, isLoading, isError } = useQuery({
    queryKey: [queryKey, 'panel', debouncedSearch],
    queryFn: async () => {
      const { data: res } = await apiClient.get<Paginated<DepartmentRecord>>(apiPath, {
        params: { search: debouncedSearch || undefined },
      });
      return res.results;
    },
  });

  return (
    <aside className="doctor-list-panel" aria-label={title}>
      <Typography.Title level={5} style={{ marginTop: 0 }}>{title}</Typography.Title>
      <Input
        placeholder="Search name or code"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        allowClear
        style={{ marginBottom: 12 }}
      />
      {isLoading && <Skeleton active paragraph={{ rows: 6 }} />}
      {isError && <Typography.Text type="danger">Could not load list.</Typography.Text>}
      {!isLoading && !isError && (data?.length ?? 0) === 0 && (
        <Empty description="No records found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
      <div className="doctor-list-panel-scroll">
        {(data ?? []).map((item) => {
          const selected = selectedId === item.id;
          return (
            <Card
              key={item.id}
              size="small"
              hoverable
              className={`doctor-list-card${selected ? ' doctor-list-card--selected' : ''}`}
              onClick={() => onSelect(item.id)}
            >
              <Typography.Text strong className="doctor-list-card-name">{item.name}</Typography.Text>
              {item.code ? (
                <Typography.Text type="secondary" className="doctor-list-card-meta">
                  {item.code}
                </Typography.Text>
              ) : null}
            </Card>
          );
        })}
      </div>
    </aside>
  );
}
