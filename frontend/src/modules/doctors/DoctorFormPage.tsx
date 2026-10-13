import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, Form, Input, InputNumber, Switch } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import { apiClient } from '../../api/client';
import type { Doctor } from '../../api/types/models';
import { useAuth } from '../../auth/AuthContext';
import { PageHeader } from '../../components/PageHeader';
import { ErrorBlock, LoadingBlock } from '../../components/QueryState';

const schema = z.object({
  name: z.string().min(1),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
  registration_number: z.string().optional(),
  phone: z.string().optional(),
  consultation_fee: z.number().min(0),
  is_referral: z.boolean(),
  hospital_clinic_name: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function DoctorFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['doctor', id],
    enabled: isEdit,
    queryFn: async () => (await apiClient.get<Doctor>(`/doctors/${id}/`)).data,
  });

  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', is_referral: false, consultation_fee: 500 },
  });

  useEffect(() => {
    if (data) {
      reset({
        ...data,
        consultation_fee: Number(data.consultation_fee),
      });
    }
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = { ...values, branch: user?.branch };
      if (isEdit) {
        await apiClient.patch(`/doctors/${id}/`, payload);
      } else {
        await apiClient.post('/doctors/', payload);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['doctors'] });
      navigate('/doctors');
    },
  });

  if (isEdit && isLoading) {
    return <LoadingBlock />;
  }
  if (isEdit && isError) {
    return <ErrorBlock message="Failed to load doctor" />;
  }

  return (
    <>
      <PageHeader title={isEdit ? 'Edit doctor' : 'Add doctor'} breadcrumbs={[{ title: 'Doctors' }]} />
      <Card>
        <Form layout="vertical" onFinish={handleSubmit((v) => mutation.mutate(v))}>
          <Controller name="name" control={control} render={({ field }) => <Form.Item label="Name"><Input {...field} autoFocus /></Form.Item>} />
          <Controller name="specialization" control={control} render={({ field }) => <Form.Item label="Specialization"><Input {...field} /></Form.Item>} />
          <Controller name="qualification" control={control} render={({ field }) => <Form.Item label="Qualification"><Input {...field} /></Form.Item>} />
          <Controller name="registration_number" control={control} render={({ field }) => <Form.Item label="Registration no."><Input {...field} /></Form.Item>} />
          <Controller name="phone" control={control} render={({ field }) => <Form.Item label="Phone"><Input {...field} /></Form.Item>} />
          <Controller
            name="consultation_fee"
            control={control}
            render={({ field }) => (
              <Form.Item label="Consultation fee (₹)">
                <InputNumber style={{ width: '100%' }} min={0} step={50} {...field} />
              </Form.Item>
            )}
          />
          <Controller name="is_referral" control={control} render={({ field }) => <Form.Item label="Referral doctor"><Switch checked={field.value} onChange={field.onChange} /></Form.Item>} />
          <Controller name="hospital_clinic_name" control={control} render={({ field }) => <Form.Item label="Hospital / clinic"><Input {...field} /></Form.Item>} />
          <Button type="primary" htmlType="submit" loading={mutation.isPending}>Save</Button>
        </Form>
      </Card>
    </>
  );
}
