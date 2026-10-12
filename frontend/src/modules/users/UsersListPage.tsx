import { Button, Table } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { apiClient } from '../../api/client';
import type { Paginated, UserRecord } from '../../api/types/models';
import { PageHeader } from '../../components/PageHeader';
import { QueryGate } from '../../components/QueryState';

export function UsersListPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data: res } = await apiClient.get<Paginated<UserRecord>>('/users/');
      return res;
    },
  });

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Manage staff accounts and roles"
        breadcrumbs={[{ title: 'User management' }]}
        extra={<Button type="primary" onClick={() => navigate('/users/new')}>New user</Button>}
      />
      <QueryGate isLoading={isLoading} isError={isError} isEmpty={data?.results.length === 0}>
        <Table
          rowKey="id"
          dataSource={data?.results}
          columns={[
            { title: 'Username', dataIndex: 'username' },
            { title: 'Email', dataIndex: 'email' },
            { title: 'Roles', dataIndex: 'role_names', render: (v: string[]) => v.join(', ') },
            {
              title: 'Actions',
              render: (_, record) => (
                <Button type="link" onClick={() => navigate(`/users/${record.id}`)}>Edit</Button>
              ),
            },
          ]}
          pagination={{ pageSize: 20, total: data?.count }}
        />
      </QueryGate>
    </>
  );
}
