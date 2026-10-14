import { AutoComplete, DatePicker, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { useMemo } from 'react';

import { apiClient } from '../api/client';
import type { Branch, Doctor, Paginated } from '../api/types/models';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

export type BillVisitContextState = {
  doctorId: number | null;
  doctorSearch: string;
  hospitalId: number | null;
  hospitalSearch: string;
  sampleCollectedAt: Dayjs;
  sampleTestedAt: Dayjs | null;
};

type BillVisitContextFieldsProps = {
  value: BillVisitContextState;
  onChange: (patch: Partial<BillVisitContextState>) => void;
  disabled?: boolean;
};

export function BillVisitContextFields({ value, onChange, disabled = false }: BillVisitContextFieldsProps) {
  const debouncedDoctorSearch = useDebouncedValue(value.doctorSearch, 300);
  const debouncedHospitalSearch = useDebouncedValue(value.hospitalSearch, 300);

  const doctorsQuery = useQuery({
    queryKey: ['doctors', debouncedDoctorSearch],
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<Doctor>>('/doctors/', {
        params: { search: debouncedDoctorSearch || undefined, page_size: 20 },
      });
      return data.results;
    },
  });

  const branchesQuery = useQuery({
    queryKey: ['branches', debouncedHospitalSearch],
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<Branch>>('/branches/', {
        params: { search: debouncedHospitalSearch || undefined, page_size: 20 },
      });
      return data.results;
    },
  });

  const doctorOptions = useMemo(
    () =>
      (doctorsQuery.data ?? []).map((doc) => ({
        value: String(doc.id),
        label: doc.specialization ? `${doc.name} — ${doc.specialization}` : doc.name,
        doctor: doc,
      })),
    [doctorsQuery.data],
  );

  const hospitalOptions = useMemo(
    () =>
      (branchesQuery.data ?? []).map((branch) => ({
        value: String(branch.id),
        label: branch.name,
        branch,
      })),
    [branchesQuery.data],
  );

  return (
    <div className="billing-context-grid">
      <div className="billing-context-field">
        <Typography.Text type="secondary" className="billing-grid-label">Doctor</Typography.Text>
        <AutoComplete
          style={{ width: '100%' }}
          disabled={disabled}
          value={value.doctorSearch}
          options={doctorOptions}
          onSearch={(text) => onChange({ doctorSearch: text, doctorId: null })}
          onSelect={(optionValue) => {
            const match = doctorOptions.find((o) => o.value === optionValue);
            if (match) {
              onChange({ doctorId: match.doctor.id, doctorSearch: match.doctor.name });
            }
          }}
          placeholder="Type or pick a doctor"
          notFoundContent={doctorsQuery.isLoading ? 'Loading…' : null}
          allowClear
          onClear={() => onChange({ doctorSearch: '', doctorId: null })}
        />
      </div>
      <div className="billing-context-field">
        <Typography.Text type="secondary" className="billing-grid-label">Hospital</Typography.Text>
        <AutoComplete
          style={{ width: '100%' }}
          disabled={disabled}
          value={value.hospitalSearch}
          options={hospitalOptions}
          onSearch={(text) => onChange({ hospitalSearch: text, hospitalId: null })}
          onSelect={(optionValue) => {
            const match = hospitalOptions.find((o) => o.value === optionValue);
            if (match) {
              onChange({ hospitalId: match.branch.id, hospitalSearch: match.branch.name });
            }
          }}
          placeholder="Type or pick a hospital"
          notFoundContent={branchesQuery.isLoading ? 'Loading…' : null}
          allowClear
          onClear={() => onChange({ hospitalSearch: '', hospitalId: null })}
        />
      </div>
      <div className="billing-context-field">
        <Typography.Text type="secondary" className="billing-grid-label">Sample collected</Typography.Text>
        <DatePicker
          showTime
          format="DD MMM YYYY, hh:mm A"
          style={{ width: '100%' }}
          disabled={disabled}
          value={value.sampleCollectedAt}
          onChange={(d) => d && onChange({ sampleCollectedAt: d })}
        />
      </div>
      <div className="billing-context-field">
        <Typography.Text type="secondary" className="billing-grid-label">Sample tested</Typography.Text>
        <DatePicker
          showTime
          format="DD MMM YYYY, hh:mm A"
          style={{ width: '100%' }}
          disabled={disabled}
          value={value.sampleTestedAt}
          onChange={(d) => onChange({ sampleTestedAt: d })}
          allowClear
          onClear={() => onChange({ sampleTestedAt: null })}
        />
      </div>
    </div>
  );
}

export function defaultBillVisitContext(): BillVisitContextState {
  return {
    doctorId: null,
    doctorSearch: '',
    hospitalId: null,
    hospitalSearch: '',
    sampleCollectedAt: dayjs(),
    sampleTestedAt: null,
  };
}

export function billVisitContextFromDetail(detail: {
  doctor: number | null;
  doctor_name: string;
  hospital: number | null;
  hospital_name: string;
  sample_collected_at: string;
  sample_tested_at: string | null;
}): BillVisitContextState {
  return {
    doctorId: detail.doctor,
    doctorSearch: detail.doctor_name,
    hospitalId: detail.hospital,
    hospitalSearch: detail.hospital_name,
    sampleCollectedAt: dayjs(detail.sample_collected_at),
    sampleTestedAt: detail.sample_tested_at ? dayjs(detail.sample_tested_at) : null,
  };
}

export function billVisitContextToLabSessionPayload(state: BillVisitContextState) {
  const payload: Record<string, unknown> = {
    doctor: state.doctorId,
    hospital: state.hospitalId,
    doctor_name: state.doctorSearch.trim(),
    hospital_name: state.hospitalSearch.trim(),
  };
  if (state.sampleCollectedAt?.isValid()) {
    payload.sample_collected_at = state.sampleCollectedAt.toISOString();
  }
  payload.sample_tested_at =
    state.sampleTestedAt && state.sampleTestedAt.isValid()
      ? state.sampleTestedAt.toISOString()
      : null;
  return payload;
}
