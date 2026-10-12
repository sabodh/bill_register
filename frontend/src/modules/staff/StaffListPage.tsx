import { Button, Table } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { apiClient } from '../../api/client';
import type { Paginated, StaffMember } from '../../api/types/models';
import { PageHeader } from '../../components/PageHeader';
import { QueryGate } from '../../components/QueryState';

export function StaffListPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => (await apiClient.get<Paginated<StaffMember>>('/staff/')).data,
  });

  return (
    <>
      <PageHeader
        title="Staff"
        breadcrumbs={[{ title: 'Registration' }, { title: 'Staff' }]}
        extra={<Button type="primary" onClick={() => navigate('/staff/new')}>Add staff</Button>}
      />
      <QueryGate isLoading={isLoading} isError={isError} isEmpty={data?.results.length === 0}>
        <Table
          rowKey="id"
          dataSource={data?.results}
          columns={[
            { title: 'Employee ID', dataIndex: 'employee_id' },
            { title: 'Designation', dataIndex: 'designation' },
            { title: 'Linked user', dataIndex: 'username' },
            {
              title: 'Actions',
              render: (_, record) => (
                <Button type="link" onClick={() => navigate(`/staff/${record.id}`)}>Edit</Button>
              ),
            },
          ]}
        />
      </QueryGate>
    </>
  );
}
