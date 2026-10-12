import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, Form, Input, Select } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import { apiClient } from '../../api/client';
import type { Patient } from '../../api/types/models';
import { PageHeader } from '../../components/PageHeader';
import { LoadingBlock, ErrorBlock } from '../../components/QueryState';
import { useAuth } from '../../auth/AuthContext';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  gender: z.enum(['M', 'F', 'O']),
  date_of_birth: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  branch: z.number(),
});

type FormValues = z.infer<typeof schema>;

export function PatientFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['patient', id],
    enabled: isEdit,
    queryFn: async () => {
      const { data: patient } = await apiClient.get<Patient>(`/patients/${id}/`);
      return patient;
    },
  });

  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      gender: 'M',
      phone: '',
      address: '',
      branch: user?.branch ?? 0,
    },
  });

  useEffect(() => {
    if (data) {
      reset({
        name: data.name,
        gender: data.gender,
        date_of_birth: data.date_of_birth ?? '',
        phone: data.phone,
        address: data.address,
        branch: data.branch,
      });
    }
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        ...values,
        date_of_birth: values.date_of_birth || null,
        branch: values.branch || user?.branch,
      };
      if (isEdit) {
        await apiClient.patch(`/patients/${id}/`, payload);
      } else {
        await apiClient.post('/patients/', payload);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['patients'] });
      navigate('/patients');
    },
  });

  if (isEdit && isLoading) {
    return <LoadingBlock />;
  }
  if (isEdit && isError) {
    return <ErrorBlock message="Failed to load patient" />;
  }

  return (
    <>
      <PageHeader
        title={isEdit ? 'Edit patient' : 'Register patient'}
        breadcrumbs={[{ title: 'Patients' }, { title: isEdit ? 'Edit' : 'New' }]}
      />
      <Card>
        <Form layout="vertical" onFinish={handleSubmit((v) => mutation.mutate(v))}>
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <Form.Item label="Full name" validateStatus={fieldState.error ? 'error' : ''} help={fieldState.error?.message}>
                <Input {...field} autoFocus />
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
          <Controller
            name="date_of_birth"
            control={control}
            render={({ field }) => (
              <Form.Item label="Date of birth">
                <Input {...field} type="date" />
              </Form.Item>
            )}
          />
          <Controller
            name="phone"
            control={control}
            render={({ field }) => <Form.Item label="Phone"><Input {...field} /></Form.Item>}
          />
          <Controller
            name="address"
            control={control}
            render={({ field }) => <Form.Item label="Address"><Input.TextArea {...field} rows={3} /></Form.Item>}
          />
          <Button type="primary" htmlType="submit" loading={mutation.isPending}>
            Save
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={() => navigate('/patients')}>Cancel</Button>
        </Form>
      </Card>
    </>
  );
}
