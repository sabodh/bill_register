import { zodResolver } from '@hookform/resolvers/zod';
import { AutoComplete, Button, Divider, Form, Input, InputNumber, Select, Typography, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { apiClient } from '../../api/client';
import type { Doctor, Paginated, Patient } from '../../api/types/models';
import { useAuth } from '../../auth/AuthContext';
import { ErrorBlock, LoadingBlock } from '../../components/QueryState';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { ageFromDob, dobFromAge } from '../../utils/ageDob';
import {
  formatMoney,
  patientRegistrationSchema,
  type PatientRegistrationFormValues,
  type RegistrationFees,
} from './patientRegistrationSchema';

export type PatientRegistrationPanelProps = {
  patientId?: number;
  /** First tab in workspace receives autofocus on name */
  autoFocusName?: boolean;
  onTitleChange?: (title: string, dirty: boolean) => void;
  onSuccess?: (patient: Patient) => void;
  onCancel?: () => void;
  showCancel?: boolean;
};

export function PatientRegistrationPanel({
  patientId,
  autoFocusName,
  onTitleChange,
  onSuccess,
  onCancel,
  showCancel,
}: PatientRegistrationPanelProps) {
  const isEdit = Boolean(patientId);
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuth();
  const [doctorSearch, setDoctorSearch] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const dobAgeLock = useRef<'dob' | 'age' | null>(null);
  const debouncedDoctorSearch = useDebouncedValue(doctorSearch, 300);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['patient', patientId],
    enabled: isEdit,
    queryFn: async () => {
      const { data: patient } = await apiClient.get<Patient>(`/patients/${patientId}/`);
      return patient;
    },
  });

  const feesQuery = useQuery({
    queryKey: ['registration-fees'],
    queryFn: async () => {
      const { data: fees } = await apiClient.get<RegistrationFees>('/patients/registration-fees/');
      return fees;
    },
    enabled: !isEdit,
  });

  const doctorsQuery = useQuery({
    queryKey: ['doctors', debouncedDoctorSearch],
    queryFn: async () => {
      const { data: res } = await apiClient.get<Paginated<Doctor>>('/doctors/', {
        params: { search: debouncedDoctorSearch || undefined },
      });
      return res.results;
    },
  });

  const { control, handleSubmit, reset, setValue, watch } = useForm<PatientRegistrationFormValues>({
    resolver: zodResolver(patientRegistrationSchema),
    defaultValues: {
      name: '',
      gender: 'M',
      phone: '',
      address: '',
      file_number: '',
      doctor: null,
      age: null,
      branch: user?.branch ?? 0,
    },
  });

  const watchedName = watch('name');
  const watchedDob = watch('date_of_birth');
  const watchedAge = watch('age');
  const onTitleChangeRef = useRef(onTitleChange);
  onTitleChangeRef.current = onTitleChange;
  const lastTitleReport = useRef<{ title: string; dirty: boolean } | null>(null);

  useEffect(() => {
    const title = watchedName?.trim() || (isEdit ? 'Edit' : 'New');
    const dirty = Boolean(watchedName?.trim());
    const prev = lastTitleReport.current;
    if (prev && prev.title === title && prev.dirty === dirty) {
      return;
    }
    lastTitleReport.current = { title, dirty };
    onTitleChangeRef.current?.(title, dirty);
  }, [watchedName, isEdit]);

  useEffect(() => {
    if (dobAgeLock.current === 'age') {
      return;
    }
    if (watchedDob) {
      const computed = ageFromDob(watchedDob);
      if (computed !== null && computed !== watchedAge) {
        setValue('age', computed, { shouldValidate: false });
      }
    }
  }, [watchedDob, setValue, watchedAge]);

  useEffect(() => {
    if (dobAgeLock.current === 'dob') {
      return;
    }
    if (watchedAge !== null && watchedAge !== undefined && watchedAge >= 0) {
      const estimated = dobFromAge(watchedAge);
      if (estimated !== watchedDob) {
        setValue('date_of_birth', estimated, { shouldValidate: false });
      }
    }
  }, [watchedAge, setValue, watchedDob]);

  useEffect(() => {
    if (data) {
      reset({
        name: data.name,
        gender: data.gender,
        date_of_birth: data.date_of_birth ?? '',
        age: data.age_years,
        phone: data.phone,
        address: data.address,
        file_number: data.file_number ?? '',
        doctor: data.doctor,
        branch: data.branch,
      });
      if (data.doctor_detail) {
        setSelectedDoctor(data.doctor_detail);
        setDoctorSearch(data.doctor_detail.name);
      }
    }
  }, [data, reset]);

  const doctorOptions = useMemo(
    () =>
      (doctorsQuery.data ?? []).map((doc) => ({
        value: String(doc.id),
        label: `${doc.name}${doc.specialization ? ` — ${doc.specialization}` : ''} (${formatMoney(Number(doc.consultation_fee))})`,
        doctor: doc,
      })),
    [doctorsQuery.data],
  );

  const registrationFee = Number(feesQuery.data?.registration_fee ?? 0);
  const doctorFee = selectedDoctor ? Number(selectedDoctor.consultation_fee) : 0;
  const totalFees = registrationFee + doctorFee;

  const mutation = useMutation({
    mutationFn: async (values: PatientRegistrationFormValues) => {
      const payload = {
        ...values,
        date_of_birth: values.date_of_birth || null,
        age: values.date_of_birth ? undefined : values.age,
        branch: values.branch || user?.branch,
        doctor: values.doctor ?? null,
      };
      let patient: Patient;
      if (isEdit && patientId) {
        const { data: updated } = await apiClient.patch<Patient>(`/patients/${patientId}/`, payload);
        patient = updated;
      } else {
        const { data: created } = await apiClient.post<Patient>('/patients/', payload);
        patient = created;
        if (
          hasPermission('billing.add_bill') &&
          feesQuery.data &&
          (registrationFee > 0 || doctorFee > 0)
        ) {
          const lines = [];
          if (registrationFee > 0) {
            lines.push({
              billing_item: feesQuery.data.registration_item_id,
              description: 'Registration fee',
              quantity: 1,
              unit_price: registrationFee,
            });
          }
          if (selectedDoctor && doctorFee > 0) {
            lines.push({
              billing_item: feesQuery.data.consultation_item_id,
              description: `Doctor fee — ${selectedDoctor.name}`,
              quantity: 1,
              unit_price: doctorFee,
            });
          }
          if (lines.length > 0) {
            await apiClient.post('/billing/bills/', { patient: patient.id, lines });
          }
        }
      }
      return patient;
    },
    onSuccess: async (patient) => {
      await queryClient.invalidateQueries({ queryKey: ['patients'] });
      message.success(isEdit ? 'Patient updated' : `Registered ${patient.uhid}`);
      onSuccess?.(patient);
    },
    onError: () => message.error('Could not save registration'),
  });

  if (isEdit && isLoading) {
    return <LoadingBlock />;
  }
  if (isEdit && isError) {
    return <ErrorBlock message="Failed to load patient" />;
  }

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))}>
      <Form layout="vertical" component={false}>
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState }) => (
            <Form.Item
              label="Name"
              validateStatus={fieldState.error ? 'error' : ''}
              help={fieldState.error?.message}
              required
            >
              <Input {...field} autoFocus={autoFocusName} />
            </Form.Item>
          )}
        />
        <Controller
          name="address"
          control={control}
          render={({ field }) => (
            <Form.Item label="Address">
              <Input.TextArea {...field} rows={2} />
            </Form.Item>
          )}
        />
        <Controller
          name="gender"
          control={control}
          render={({ field }) => (
            <Form.Item label="Gender">
              <Select
                {...field}
                options={[
                  { value: 'M', label: 'Male' },
                  { value: 'F', label: 'Female' },
                  { value: 'O', label: 'Other' },
                ]}
              />
            </Form.Item>
          )}
        />
        <div className="registration-form-grid">
          <Controller
            name="date_of_birth"
            control={control}
            render={({ field }) => (
              <Form.Item label="Date of birth">
                <Input
                  {...field}
                  type="date"
                  onChange={(e) => {
                    dobAgeLock.current = 'dob';
                    field.onChange(e);
                    setTimeout(() => {
                      dobAgeLock.current = null;
                    }, 0);
                  }}
                />
              </Form.Item>
            )}
          />
          <Controller
            name="age"
            control={control}
            render={({ field }) => (
              <Form.Item label="Age (years)">
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={150}
                  value={field.value ?? undefined}
                  onChange={(val) => {
                    dobAgeLock.current = 'age';
                    field.onChange(val ?? null);
                    setTimeout(() => {
                      dobAgeLock.current = null;
                    }, 0);
                  }}
                />
              </Form.Item>
            )}
          />
        </div>
        <Controller
          name="file_number"
          control={control}
          render={({ field }) => (
            <Form.Item
              label="File number"
              extra={isEdit ? undefined : 'Leave blank to use auto-generated UHID after save'}
            >
              <Input {...field} placeholder="Hospital file / MRD number" />
            </Form.Item>
          )}
        />
        <Controller
          name="doctor"
          control={control}
          render={({ field }) => (
            <Form.Item label="Doctor">
              <AutoComplete
                value={doctorSearch}
                options={doctorOptions}
                onSearch={setDoctorSearch}
                placeholder="Search doctor by name"
                onSelect={(value) => {
                  const match = doctorOptions.find((o) => o.value === value);
                  if (match) {
                    setSelectedDoctor(match.doctor);
                    field.onChange(match.doctor.id);
                    setDoctorSearch(match.doctor.name);
                  }
                }}
                onClear={() => {
                  setSelectedDoctor(null);
                  field.onChange(null);
                  setDoctorSearch('');
                }}
                allowClear
              />
            </Form.Item>
          )}
        />
        <Controller
          name="phone"
          control={control}
          render={({ field }) => <Form.Item label="Phone"><Input {...field} /></Form.Item>}
        />
      </Form>

      {!isEdit && (
        <>
          <Divider />
          <Typography.Title level={5} style={{ marginTop: 0 }}>Fees</Typography.Title>
          <div className="registration-fees-summary">
            <div className="registration-fees-row">
              <span>Registration fee</span>
              <strong>{formatMoney(registrationFee)}</strong>
            </div>
            <div className="registration-fees-row">
              <span>Doctor fee{selectedDoctor ? ` (${selectedDoctor.name})` : ''}</span>
              <strong>{formatMoney(doctorFee)}</strong>
            </div>
            <Divider style={{ margin: '8px 0' }} />
            <div className="registration-fees-row registration-fees-total">
              <span>Total</span>
              <strong>{formatMoney(totalFees)}</strong>
            </div>
          </div>
        </>
      )}

      <div style={{ marginTop: 24 }}>
        <Button type="primary" htmlType="submit" loading={mutation.isPending}>
          {isEdit ? 'Save' : 'Register & save'}
        </Button>
        {showCancel && onCancel && (
          <Button style={{ marginLeft: 8 }} onClick={onCancel}>Cancel</Button>
        )}
      </div>
    </form>
  );
}
