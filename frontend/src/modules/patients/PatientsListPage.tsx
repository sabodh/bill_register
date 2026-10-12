import { Button, Input, Table } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiClient } from '../../api/client';
import type { Paginated, Patient } from '../../api/types/models';
import { PageHeader } from '../../components/PageHeader';
import { QueryGate } from '../../components/QueryState';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

export function PatientsListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['patients', page, debouncedSearch],
    queryFn: async () => {
      const { data: res } = await apiClient.get<Paginated<Patient>>('/patients/', {
        params: { page, search: debouncedSearch || undefined },
      });
      return res;
    },
  });

  const columns = useMemo(
    () => [
      { title: 'UHID', dataIndex: 'uhid', key: 'uhid' },
      { title: 'Name', dataIndex: 'name', key: 'name' },
      { title: 'Phone', dataIndex: 'phone', key: 'phone' },
      { title: 'Gender', dataIndex: 'gender', key: 'gender' },
      {
        title: 'Actions',
        key: 'actions',
        render: (_: unknown, record: Patient) => (
          <Button type="link" onClick={() => navigate(`/patients/${record.id}`)}>Edit</Button>
        ),
      },
    ],
    [navigate],
  );

  return (
    <>
      <PageHeader
        title="Patients"
        subtitle="Search by name, phone, or UHID"
        breadcrumbs={[{ title: 'Registration' }, { title: 'Patients' }]}
        extra={
          <Button type="primary" onClick={() => navigate('/patients/new')}>
            Register patient
          </Button>
        }
      />
      <Input
        placeholder="Search name, phone, UHID"
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
        emptyDescription="No patients found"
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
