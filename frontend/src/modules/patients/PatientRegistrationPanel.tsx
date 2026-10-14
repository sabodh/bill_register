import { zodResolver } from '@hookform/resolvers/zod';
import { AutoComplete, Button, Divider, Form, Input, InputNumber, Select, Typography, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { apiClient } from '../../api/client';
import type { Doctor, Paginated, Patient, PatientRevisitResult } from '../../api/types/models';
import { useAuth } from '../../auth/AuthContext';
import { ErrorBlock, LoadingBlock } from '../../components/QueryState';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { ageFromDob, dobFromAge } from '../../utils/ageDob';
import {
  formatMoney,
  patientRegistrationSchema,
  type ConsultationFeePreview,
  type PatientRegistrationFormValues,
  type RegistrationFees,
} from './patientRegistrationSchema';

export type PatientRegistrationPanelProps = {
  patientId?: number;
  /** First tab in workspace receives autofocus on name */
  autoFocusName?: boolean;
  /** Set doctor from registration desk token board */
  pendingDoctorId?: number | null;
  onPendingDoctorConsumed?: () => void;
  onDoctorChange?: (doctorId: number | null) => void;
  onTitleChange?: (title: string, dirty: boolean) => void;
  onSuccess?: (patient: Patient) => void;
  onCancel?: () => void;
  showCancel?: boolean;
};

export function PatientRegistrationPanel({
  patientId,
  autoFocusName,
  pendingDoctorId,
  onPendingDoctorConsumed,
  onDoctorChange,
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
  const [revisitPatientSearch, setRevisitPatientSearch] = useState('');
  const [selectedRevisitPatient, setSelectedRevisitPatient] = useState<Patient | null>(null);
  const dobAgeLock = useRef<'dob' | 'age' | null>(null);
  const hydratedPatientId = useRef<number | null>(null);
  const debouncedDoctorSearch = useDebouncedValue(doctorSearch, 300);
  const debouncedRevisitSearch = useDebouncedValue(revisitPatientSearch, 300);

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

  const revisitPatientsQuery = useQuery({
    queryKey: ['patients', 'revisit-search', debouncedRevisitSearch],
    enabled: !isEdit && debouncedRevisitSearch.trim().length >= 2,
    queryFn: async () => {
      const { data: res } = await apiClient.get<Paginated<Patient>>('/patients/', {
        params: { search: debouncedRevisitSearch.trim() },
      });
      return res.results;
    },
  });

  const { control, handleSubmit, reset, setValue, watch } = useForm<PatientRegistrationFormValues>({
    resolver: zodResolver(patientRegistrationSchema),
    defaultValues: {
      registration_kind: 'NEW_OP',
      revisit_patient_id: null,
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

  const watchedKind = watch('registration_kind');
  const isRevisit = !isEdit && watchedKind === 'REVISIT';
  const watchedDoctorId = watch('doctor');
  const watchedRevisitPatientId = watch('revisit_patient_id');
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
    if (!isEdit) {
      hydratedPatientId.current = null;
      return;
    }
    if (!data) {
      return;
    }
    if (hydratedPatientId.current === data.id) {
      return;
    }
    hydratedPatientId.current = data.id;
    const dobForInput = data.date_of_birth ? data.date_of_birth.slice(0, 10) : '';
    reset({
      registration_kind: 'NEW_OP',
      revisit_patient_id: null,
      name: data.name,
      gender: data.gender,
      date_of_birth: dobForInput,
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
    } else {
      setSelectedDoctor(null);
      setDoctorSearch('');
    }
  }, [data, reset, isEdit]);

  useEffect(() => {
    hydratedPatientId.current = null;
  }, [patientId]);

  useEffect(() => {
    if (!pendingDoctorId || isEdit) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data: doctor } = await apiClient.get<Doctor>(`/doctors/${pendingDoctorId}/`);
        if (cancelled) {
          return;
        }
        setSelectedDoctor(doctor);
        setValue('doctor', doctor.id);
        setDoctorSearch(doctor.name);
        onDoctorChange?.(doctor.id);
        onPendingDoctorConsumed?.();
      } catch {
        message.error('Could not load doctor');
        onPendingDoctorConsumed?.();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pendingDoctorId, isEdit, setValue, onPendingDoctorConsumed]);

  const doctorOptions = useMemo(
    () =>
      (doctorsQuery.data ?? []).map((doc) => ({
        value: String(doc.id),
        label: `${doc.name}${doc.specialization ? ` — ${doc.specialization}` : ''} (${formatMoney(Number(doc.consultation_fee))})`,
        doctor: doc,
      })),
    [doctorsQuery.data],
  );

  const feePreviewQuery = useQuery({
    queryKey: ['fee-preview', watchedRevisitPatientId, watchedDoctorId],
    enabled:
      !isEdit &&
      isRevisit &&
      Boolean(watchedRevisitPatientId && watchedDoctorId),
    queryFn: async () => {
      const { data: preview } = await apiClient.get<ConsultationFeePreview>('/patients/fee-preview/', {
        params: { patient: watchedRevisitPatientId, doctor: watchedDoctorId },
      });
      return preview;
    },
  });

  const registrationFee = isRevisit ? 0 : Number(feesQuery.data?.registration_fee ?? 0);
  const consultationFeeWaived = Boolean(feePreviewQuery.data?.consultation_fee_waived);
  const doctorFee = (() => {
    if (!selectedDoctor && !watchedDoctorId) {
      return 0;
    }
    if (isRevisit && feePreviewQuery.data) {
      return Number(feePreviewQuery.data.consultation_fee);
    }
    return selectedDoctor ? Number(selectedDoctor.consultation_fee) : 0;
  })();
  const totalFees = registrationFee + doctorFee;

  const revisitPatientOptions = useMemo(
    () =>
      (revisitPatientsQuery.data ?? []).map((p) => ({
        value: String(p.id),
        label: `${p.uhid} — ${p.name}${p.phone ? ` (${p.phone})` : ''}`,
        patient: p,
      })),
    [revisitPatientsQuery.data],
  );

  const mutation = useMutation({
    mutationFn: async (values: PatientRegistrationFormValues) => {
      if (!isEdit && values.registration_kind === 'REVISIT') {
        const patientIdForRevisit = values.revisit_patient_id;
        if (!patientIdForRevisit || !values.doctor) {
          throw new Error('Missing revisit patient or doctor');
        }
        const { data: revisit } = await apiClient.post<PatientRevisitResult>(
          `/patients/${patientIdForRevisit}/revisit/`,
          { doctor: values.doctor, registration_kind: 'REVISIT' },
        );
        if (hasPermission('billing.add_bill') && feesQuery.data && selectedDoctor && doctorFee > 0) {
          await apiClient.post('/billing/bills/', {
            patient: revisit.patient,
            lines: [
              {
                billing_item: feesQuery.data.consultation_item_id,
                description: `Doctor fee — ${selectedDoctor.name}`,
                quantity: 1,
                unit_price: doctorFee,
              },
            ],
          });
        }
        const patient: Patient = {
          id: revisit.patient,
          uhid: revisit.uhid,
          name: revisit.name,
          gender: selectedRevisitPatient?.gender ?? 'M',
          date_of_birth: selectedRevisitPatient?.date_of_birth ?? null,
          age_years: selectedRevisitPatient?.age_years ?? null,
          phone: selectedRevisitPatient?.phone ?? '',
          address: selectedRevisitPatient?.address ?? '',
          file_number: selectedRevisitPatient?.file_number ?? '',
          doctor: revisit.doctor,
          op_token: revisit.op_token,
          branch: selectedRevisitPatient?.branch ?? user?.branch ?? 0,
          is_active: true,
        };
        return patient;
      }

      const {
        revisit_patient_id: _revisitId,
        registration_kind,
        ...patientFields
      } = values;
      const payload = {
        ...patientFields,
        date_of_birth: values.date_of_birth || null,
        age: values.date_of_birth ? undefined : values.age,
        branch: values.branch || user?.branch,
        doctor: values.doctor ?? null,
        registration_kind: registration_kind ?? 'NEW_OP',
      };
      let patient: Patient;
      if (isEdit && patientId) {
        const { registration_kind: _rk, ...editPayload } = payload;
        const { data: updated } = await apiClient.patch<Patient>(`/patients/${patientId}/`, {
          ...editPayload,
          name: (values.name ?? '').trim(),
        });
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
      await queryClient.invalidateQueries({ queryKey: ['doctors', 'op-tokens'] });
      if (isEdit && patientId) {
        queryClient.setQueryData(['patient', patientId], patient);
        hydratedPatientId.current = patient.id;
        const dobForInput = patient.date_of_birth ? patient.date_of_birth.slice(0, 10) : '';
        reset({
          registration_kind: 'NEW_OP',
          revisit_patient_id: null,
          name: patient.name,
          gender: patient.gender,
          date_of_birth: dobForInput,
          age: patient.age_years,
          phone: patient.phone,
          address: patient.address,
          file_number: patient.file_number ?? '',
          doctor: patient.doctor,
          branch: patient.branch,
        });
        if (patient.doctor_detail) {
          setSelectedDoctor(patient.doctor_detail);
          setDoctorSearch(patient.doctor_detail.name);
        }
      }
      const tokenNote = !isEdit && patient.op_token ? ` — Token ${patient.op_token}` : '';
      message.success(isEdit ? 'Patient updated' : `Registered ${patient.uhid}${tokenNote}`);
      onSuccess?.(patient);
    },
    onError: (error) => {
      const detail =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      message.error(typeof detail === 'string' ? detail : 'Could not save registration');
    },
  });

  if (isEdit && isLoading) {
    return <LoadingBlock />;
  }
  if (isEdit && isError) {
    return <ErrorBlock message="Failed to load patient" />;
  }

  return (
    <form className="registration-form" onSubmit={handleSubmit((v) => mutation.mutate(v))}>
      <Form layout="vertical" component={false}>
        {!isEdit && (
          <Controller
            name="registration_kind"
            control={control}
            render={({ field }) => (
              <Form.Item label="Visit type">
                <Select
                  {...field}
                  options={[
                    { value: 'NEW_OP', label: 'New OP' },
                    { value: 'REVISIT', label: 'Revisit' },
                  ]}
                  onChange={(value) => {
                    field.onChange(value);
                    if (value === 'NEW_OP') {
                      setSelectedRevisitPatient(null);
                      setRevisitPatientSearch('');
                      setValue('revisit_patient_id', null);
                    }
                  }}
                />
              </Form.Item>
            )}
          />
        )}
        {isRevisit && (
          <Controller
            name="revisit_patient_id"
            control={control}
            render={({ field, fieldState }) => (
              <Form.Item
                label="Existing patient"
                validateStatus={fieldState.error ? 'error' : ''}
                help={fieldState.error?.message}
                required
              >
                <AutoComplete
                  value={revisitPatientSearch}
                  options={revisitPatientOptions}
                  onSearch={setRevisitPatientSearch}
                  placeholder="Search by UHID, name, or phone"
                  onSelect={(value) => {
                    const match = revisitPatientOptions.find((o) => o.value === value);
                    if (match) {
                      setSelectedRevisitPatient(match.patient);
                      field.onChange(match.patient.id);
                      setRevisitPatientSearch(`${match.patient.uhid} — ${match.patient.name}`);
                    }
                  }}
                  onClear={() => {
                    setSelectedRevisitPatient(null);
                    field.onChange(null);
                    setRevisitPatientSearch('');
                  }}
                  allowClear
                />
              </Form.Item>
            )}
          />
        )}
        {!isRevisit && (
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
        )}
        {!isRevisit && (
          <>
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
          </>
        )}
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
                    onDoctorChange?.(match.doctor.id);
                  }
                }}
                onClear={() => {
                  setSelectedDoctor(null);
                  field.onChange(null);
                  setDoctorSearch('');
                  onDoctorChange?.(null);
                }}
                allowClear
              />
            </Form.Item>
          )}
        />
        {!isRevisit && (
        <Controller
          name="phone"
          control={control}
          render={({ field }) => <Form.Item label="Phone"><Input {...field} /></Form.Item>}
        />
        )}
      </Form>

      {!isEdit && (
        <>
          <Divider />
          <Typography.Title level={5} style={{ marginTop: 0 }}>Fees</Typography.Title>
          <div className="registration-fees-summary">
            {!isRevisit && (
            <div className="registration-fees-row">
              <span>Registration fee</span>
              <strong>{formatMoney(registrationFee)}</strong>
            </div>
            )}
            <div className="registration-fees-row">
              <span>Doctor fee{selectedDoctor ? ` (${selectedDoctor.name})` : ''}</span>
              <strong>
                {consultationFeeWaived ? (
                  <span>
                    <span style={{ textDecoration: 'line-through', opacity: 0.55, marginRight: 8 }}>
                      {formatMoney(Number(selectedDoctor?.consultation_fee ?? 0))}
                    </span>
                    {formatMoney(0)}
                  </span>
                ) : (
                  formatMoney(doctorFee)
                )}
              </strong>
            </div>
            {consultationFeeWaived && feePreviewQuery.data && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Consultation waived — within {feePreviewQuery.data.revisit_period_days}-day revisit
                period for this doctor.
              </Typography.Text>
            )}
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
          {isEdit ? 'Save' : isRevisit ? 'Register revisit' : 'Register & save'}
        </Button>
        {showCancel && onCancel && (
          <Button style={{ marginLeft: 8 }} onClick={onCancel}>Cancel</Button>
        )}
      </div>
    </form>
  );
}
