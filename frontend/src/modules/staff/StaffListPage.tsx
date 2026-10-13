import { Button, Input, Table } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiClient } from '../../api/client';
import type { Paginated, StaffMember } from '../../api/types/models';
import { PageHeader } from '../../components/PageHeader';
import { QueryGate } from '../../components/QueryState';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

export function StaffListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['staff', page, debouncedSearch],
    queryFn: async () => {
      const { data: res } = await apiClient.get<Paginated<StaffMember>>('/staff/', {
        params: { page, search: debouncedSearch || undefined },
      });
      return res;
    },
  });

  const columns = useMemo(
    () => [
      { title: 'Employee ID', dataIndex: 'employee_id', key: 'employee_id' },
      { title: 'Name', dataIndex: 'name', key: 'name' },
      {
        title: 'Department',
        key: 'department',
        render: (_: unknown, record: StaffMember) => record.department_detail?.name ?? '—',
      },
      { title: 'Mobile', dataIndex: 'phone', key: 'phone' },
      {
        title: 'Actions',
        key: 'actions',
        render: (_: unknown, record: StaffMember) => (
          <Button type="link" onClick={() => navigate(`/staff/${record.id}`)}>Edit</Button>
        ),
      },
    ],
    [navigate],
  );

  return (
    <>
      <PageHeader
        title="Staff"
        subtitle="Search by name, employee ID, mobile, or Aadhaar"
        breadcrumbs={[{ title: 'Registration' }, { title: 'Staff' }]}
        extra={<Button type="primary" onClick={() => navigate('/staff/new')}>Add staff</Button>}
      />
      <Input
        placeholder="Search staff"
        value={search}
        onChange={(e) => {
          setPage(1);
          setSearch(e.target.value);
        }}
        style={{ marginBottom: 16, maxWidth: 360 }}
        allowClear
      />
      <QueryGate
        isLoading={isLoading}
        isError={isError}
        isEmpty={!isLoading && data?.results.length === 0}
        emptyDescription="No staff found"
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data?.results}
          pagination={{
            current: page,
            total: data?.count,
            pageSize: 20,
            onChange: setPage,
            showSizeChanger: false,
          }}
        />
      </QueryGate>
    </>
  );
}
