import { AutoComplete, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { apiClient } from '../api/client';
import type { Paginated, Patient } from '../api/types/models';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

function formatAgeSex(patient: Patient) {
  const agePart = patient.age_years != null ? `${patient.age_years}y` : '—';
  const sex = { M: 'male', F: 'female', O: 'other' }[patient.gender];
  return `${agePart} / ${sex}`;
}

type PatientSessionLookupProps = {
  value: Patient | null;
  onChange: (patient: Patient | null) => void;
};

export function PatientSessionLookup({ value, onChange }: PatientSessionLookupProps) {
  const [patientSearch, setPatientSearch] = useState('');
  const debouncedPatientSearch = useDebouncedValue(patientSearch, 300);

  useEffect(() => {
    if (value) {
      setPatientSearch(`${value.uhid} — ${value.name}`);
    }
  }, [value?.id, value?.uhid, value?.name]);

  const patientsQuery = useQuery({
    queryKey: ['patients', 'session-lookup', debouncedPatientSearch],
    enabled: debouncedPatientSearch.trim().length >= 2,
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<Patient>>('/patients/', {
        params: { lookup: debouncedPatientSearch.trim(), page_size: 15 },
      });
      return data.results;
    },
  });

  const patientOptions = useMemo(
    () =>
      (patientsQuery.data ?? []).map((patient) => ({
        value: String(patient.id),
        label: [
          patient.name,
          patient.op_token != null ? `OP ${patient.op_token}` : null,
          patient.phone ? patient.phone : null,
          patient.uhid,
        ]
          .filter(Boolean)
          .join(' · '),
        patient,
      })),
    [patientsQuery.data],
  );

  const selectPatient = (patient: Patient) => {
    onChange(patient);
    setPatientSearch(`${patient.uhid} — ${patient.name}`);
  };

  return (
    <div className="billing-form-section">
      <Typography.Text strong className="billing-form-section-title">Patient</Typography.Text>
      <AutoComplete
        style={{ width: '100%', maxWidth: 520 }}
        value={patientSearch}
        options={patientOptions}
        status={patientSearch.trim() && !value ? 'warning' : undefined}
        onSearch={(searchValue) => {
          setPatientSearch(searchValue);
          if (!searchValue.trim()) {
            onChange(null);
          }
        }}
        onSelect={(optionValue) => {
          const match = patientOptions.find((o) => o.value === optionValue);
          if (match) {
            selectPatient(match.patient);
          }
        }}
        placeholder="OP token, phone, UHID, or name"
        notFoundContent={
          debouncedPatientSearch.trim().length < 2
            ? 'Type at least 2 characters'
            : patientsQuery.isLoading
              ? 'Loading…'
              : 'No patients found'
        }
        allowClear
        onClear={() => {
          onChange(null);
          setPatientSearch('');
        }}
      />
      {patientSearch.trim() && !value && (
        <Typography.Paragraph type="warning" className="billing-add-test-hint">
          Choose a patient from the dropdown (search needs at least 2 characters).
        </Typography.Paragraph>
      )}
      {value && (
        <div className="billing-patient-summary">
          <dl className="billing-patient-summary-col">
            <dt>Name</dt>
            <dd>{value.name}</dd>
          </dl>
          <dl className="billing-patient-summary-col">
            <dt>Age</dt>
            <dd>{formatAgeSex(value)}</dd>
            <dt>Phone</dt>
            <dd>{value.phone || '—'}</dd>
          </dl>
          <dl className="billing-patient-summary-address">
            <dt>Address</dt>
            <dd>{value.address || '—'}</dd>
          </dl>
        </div>
      )}
    </div>
  );
}
