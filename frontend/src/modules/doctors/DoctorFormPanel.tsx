import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Form, Input, InputNumber, Select, Switch, Typography } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { apiClient } from '../../api/client';
import type { DepartmentRecord, Doctor, Paginated } from '../../api/types/models';
import { useAuth } from '../../auth/AuthContext';
import { ErrorBlock, LoadingBlock } from '../../components/QueryState';

const schema = z.object({
  department: z.number().nullable().optional(),
  name: z.string().min(1, 'Name is required'),
  specialization: z.string().optional(),
  qualification: z.string().optional(),
  registration_number: z.string().optional(),
  phone: z.string().optional(),
  consultation_fee: z.number().min(0),
  revisit_period_days: z.number().int().min(0).max(365),
  is_referral: z.boolean(),
  hospital_clinic_name: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export type DoctorFormPanelProps = {
  doctorId?: number;
  autoFocusName?: boolean;
  onSuccess?: (doctor: Doctor) => void;
  onCancel?: () => void;
};

export function DoctorFormPanel({
  doctorId,
  autoFocusName,
  onSuccess,
  onCancel,
}: DoctorFormPanelProps) {
  const isEdit = Boolean(doctorId);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['doctor', doctorId],
    enabled: isEdit,
    queryFn: async () => (await apiClient.get<Doctor>(`/doctors/${doctorId}/`)).data,
  });

  const { control, handleSubmit, reset, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      department: null,
      name: '',
      is_referral: false,
      consultation_fee: 500,
      revisit_period_days: 0,
    },
  });

  const departmentsQuery = useQuery({
    queryKey: ['doctor-departments', 'options'],
    queryFn: async () => {
      const { data: res } = await apiClient.get<Paginated<DepartmentRecord>>('/doctor-departments/');
      return res.results;
    },
  });

  const departmentOptions = (departmentsQuery.data ?? []).map((d) => ({
    value: d.id,
    label: d.code ? `${d.name} (${d.code})` : d.name,
  }));

  const isReferral = watch('is_referral');

  useEffect(() => {
    if (data) {
      reset({
        ...data,
        consultation_fee: Number(data.consultation_fee),
        revisit_period_days: data.revisit_period_days ?? 0,
      });
    }
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = { ...values, branch: user?.branch };
      if (isEdit && doctorId) {
        const { data: updated } = await apiClient.patch<Doctor>(`/doctors/${doctorId}/`, payload);
        return updated;
      }
      const { data: created } = await apiClient.post<Doctor>('/doctors/', payload);
      return created;
    },
    onSuccess: async (doctor) => {
      await queryClient.invalidateQueries({ queryKey: ['doctors'] });
      if (doctorId) {
        await queryClient.invalidateQueries({ queryKey: ['doctor', doctorId] });
      }
      onSuccess?.(doctor);
    },
  });

  if (isEdit && isLoading) {
    return <LoadingBlock />;
  }
  if (isEdit && isError) {
    return <ErrorBlock message="Failed to load doctor" />;
  }

  return (
    <form className="registration-form" onSubmit={handleSubmit((v) => mutation.mutate(v))}>
      <Typography.Title level={5} style={{ marginTop: 0 }}>
        {isEdit ? 'Edit doctor' : 'New doctor'}
      </Typography.Title>
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
          name="department"
          control={control}
          render={({ field }) => (
            <Form.Item label="Department">
              <Select
                allowClear
                placeholder="Select department"
                options={departmentOptions}
                value={field.value ?? undefined}
                onChange={(val) => field.onChange(val ?? null)}
                loading={departmentsQuery.isLoading}
              />
            </Form.Item>
          )}
        />
        <Controller
          name="specialization"
          control={control}
          render={({ field }) => <Form.Item label="Specialization"><Input {...field} /></Form.Item>}
        />
        <Controller
          name="phone"
          control={control}
          render={({ field }) => <Form.Item label="Phone"><Input {...field} /></Form.Item>}
        />
        <div className="registration-form-grid">
          <Controller
            name="consultation_fee"
            control={control}
            render={({ field }) => (
              <Form.Item label="Consultation fee (₹)">
                <InputNumber style={{ width: '100%' }} min={0} step={50} {...field} />
              </Form.Item>
            )}
          />
          <Controller
            name="revisit_period_days"
            control={control}
            render={({ field }) => (
              <Form.Item
                label="Revisit period (days)"
                extra="0 = always charge on revisit"
              >
                <InputNumber style={{ width: '100%' }} min={0} max={365} {...field} />
              </Form.Item>
            )}
          />
        </div>
        <Controller
          name="qualification"
          control={control}
          render={({ field }) => <Form.Item label="Qualification"><Input {...field} /></Form.Item>}
        />
        <Controller
          name="registration_number"
          control={control}
          render={({ field }) => <Form.Item label="Registration no."><Input {...field} /></Form.Item>}
        />
        <Controller
          name="is_referral"
          control={control}
          render={({ field }) => (
            <Form.Item label="Referral doctor">
              <Switch checked={field.value} onChange={field.onChange} />
            </Form.Item>
          )}
        />
        {isReferral && (
          <Controller
            name="hospital_clinic_name"
            control={control}
            render={({ field }) => <Form.Item label="Hospital / clinic"><Input {...field} /></Form.Item>}
          />
        )}
      </Form>
      <div style={{ marginTop: 24 }}>
        <Button type="primary" htmlType="submit" loading={mutation.isPending}>
          {isEdit ? 'Save' : 'Add doctor'}
        </Button>
        {onCancel && (
          <Button style={{ marginLeft: 8 }} onClick={onCancel}>Cancel</Button>
        )}
      </div>
    </form>
  );
}
