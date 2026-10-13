import { Card, Empty, Input, Skeleton, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { apiClient } from '../../api/client';
import type { Doctor, Paginated } from '../../api/types/models';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { formatMoney } from '../patients/patientRegistrationSchema';

type DoctorListPanelProps = {
  selectedDoctorId?: number;
  onSelectDoctor: (doctorId: number) => void;
};

export function DoctorListPanel({ selectedDoctorId, onSelectDoctor }: DoctorListPanelProps) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['doctors', 'panel', debouncedSearch],
    queryFn: async () => {
      const { data: res } = await apiClient.get<Paginated<Doctor>>('/doctors/', {
        params: { search: debouncedSearch || undefined },
      });
      return res.results;
    },
  });

  return (
    <aside className="doctor-list-panel" aria-label="Doctors">
      <Typography.Title level={5} style={{ marginTop: 0 }}>Doctors</Typography.Title>
      <Input
        placeholder="Search name, phone, specialization"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        allowClear
        style={{ marginBottom: 12 }}
      />
      {isLoading && <Skeleton active paragraph={{ rows: 6 }} />}
      {isError && <Typography.Text type="danger">Could not load doctors.</Typography.Text>}
      {!isLoading && !isError && (data?.length ?? 0) === 0 && (
        <Empty description="No doctors found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
      <div className="doctor-list-panel-scroll">
        {(data ?? []).map((doctor) => {
          const selected = selectedDoctorId === doctor.id;
          return (
            <Card
              key={doctor.id}
              size="small"
              hoverable
              className={`doctor-list-card${selected ? ' doctor-list-card--selected' : ''}`}
              onClick={() => onSelectDoctor(doctor.id)}
            >
              <Typography.Text strong className="doctor-list-card-name">{doctor.name}</Typography.Text>
              {doctor.department_detail?.name ? (
                <Typography.Text type="secondary" className="doctor-list-card-meta">
                  {doctor.department_detail.name}
                </Typography.Text>
              ) : null}
              {doctor.specialization ? (
                <Typography.Text type="secondary" className="doctor-list-card-meta">
                  {doctor.specialization}
                </Typography.Text>
              ) : null}
              <Typography.Text type="secondary" className="doctor-list-card-meta">
                {formatMoney(Number(doctor.consultation_fee))}
                {doctor.revisit_period_days > 0 ? ` · ${doctor.revisit_period_days}d revisit` : ''}
              </Typography.Text>
            </Card>
          );
        })}
      </div>
    </aside>
  );
}
