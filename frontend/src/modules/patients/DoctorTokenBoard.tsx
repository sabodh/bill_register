import { Card, Empty, Skeleton, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../../api/client';
import type { RegistrationDeskOpTokens } from '../../api/types/models';

type DoctorTokenBoardProps = {
  selectedDoctorId?: number | null;
  onSelectDoctor?: (doctorId: number) => void;
};

function StatLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="registration-desk-stat-line">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function DoctorTokenBoard({ selectedDoctorId, onSelectDoctor }: DoctorTokenBoardProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['doctors', 'op-tokens'],
    queryFn: async () => {
      const { data: payload } = await apiClient.get<RegistrationDeskOpTokens>('/doctors/op-tokens/');
      return payload;
    },
    refetchInterval: 30_000,
  });

  const summary = data?.summary;
  const doctors = data?.doctors ?? [];

  return (
    <aside className="registration-doctor-board" aria-label="Doctor tokens today">
      <Typography.Title level={5} style={{ marginTop: 0 }}>
        Today&apos;s registrations
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 12, fontSize: 13 }}>
        Branch totals and per-doctor tokens. Click a doctor card to assign them on the form.
      </Typography.Paragraph>
      {isLoading && <Skeleton active paragraph={{ rows: 4 }} />}
      {isError && (
        <Typography.Text type="danger">Could not load registration stats.</Typography.Text>
      )}
      {!isLoading && !isError && (
        <div className="registration-doctor-board-grid">
          <Card size="small" className="registration-summary-card">
            <Typography.Text strong className="registration-doctor-token-name">
              All doctors
            </Typography.Text>
            <div className="registration-summary-total">
              <span className="registration-summary-total-label">Total</span>
              <span className="registration-summary-total-value">
                {summary?.total_registrations ?? 0}
              </span>
            </div>
            <div className="registration-desk-stat-block">
              <StatLine label="New OP" value={summary?.new_op ?? 0} />
              <StatLine label="Revisit" value={summary?.revisit ?? 0} />
            </div>
          </Card>
          {doctors.length === 0 ? (
            <div className="registration-doctor-board-empty">
              <Empty description="No doctors configured" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
          ) : (
            doctors.map((doctor) => {
              const selected = selectedDoctorId === doctor.id;
              return (
                <Card
                  key={doctor.id}
                  size="small"
                  hoverable={Boolean(onSelectDoctor)}
                  className={`registration-doctor-token-card${selected ? ' registration-doctor-token-card--selected' : ''}`}
                  onClick={() => onSelectDoctor?.(doctor.id)}
                >
                  <Typography.Text strong className="registration-doctor-token-name">
                    {doctor.name}
                  </Typography.Text>
                  {doctor.specialization ? (
                    <Typography.Text type="secondary" className="registration-doctor-token-spec">
                      {doctor.specialization}
                    </Typography.Text>
                  ) : null}
                  <div className="registration-doctor-token-value">
                    Token{' '}
                    <span className="registration-doctor-token-fraction">
                      {doctor.current_token}
                      <span className="registration-doctor-token-sep">/</span>
                      {doctor.admissions_today}
                    </span>
                  </div>
                  <div className="registration-desk-stat-block registration-desk-stat-block--compact">
                    <StatLine label="New OP" value={doctor.new_op} />
                    <StatLine label="Revisit" value={doctor.revisit} />
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}
    </aside>
  );
}
