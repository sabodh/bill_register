import { Button, Table } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { apiClient } from '../../api/client';
import type { Doctor, Paginated } from '../../api/types/models';
import { PageHeader } from '../../components/PageHeader';
import { QueryGate } from '../../components/QueryState';

export function DoctorsListPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const { data: res } = await apiClient.get<Paginated<Doctor>>('/doctors/');
      return res;
    },
  });

  return (
    <>
      <PageHeader
        title="Doctors"
        breadcrumbs={[{ title: 'Registration' }, { title: 'Doctors' }]}
        extra={<Button type="primary" onClick={() => navigate('/doctors/new')}>Add doctor</Button>}
      />
      <QueryGate isLoading={isLoading} isError={isError} isEmpty={data?.results.length === 0}>
        <Table
          rowKey="id"
          dataSource={data?.results}
          columns={[
            { title: 'Name', dataIndex: 'name' },
            { title: 'Specialization', dataIndex: 'specialization' },
            { title: 'Phone', dataIndex: 'phone' },
            {
              title: 'Actions',
              render: (_, record) => (
                <Button type="link" onClick={() => navigate(`/doctors/${record.id}`)}>Edit</Button>
              ),
            },
          ]}
        />
      </QueryGate>
    </>
  );
}
