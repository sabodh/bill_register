import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, Form, Input, InputNumber } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import { apiClient } from '../../api/client';
import type { StaffMember } from '../../api/types/models';
import { useAuth } from '../../auth/AuthContext';
import { PageHeader } from '../../components/PageHeader';
import { ErrorBlock, LoadingBlock } from '../../components/QueryState';

const schema = z.object({
  employee_id: z.string().optional(),
  designation: z.string().optional(),
  phone: z.string().optional(),
  user: z.number().nullable().optional(),
});

type FormValues = z.infer<typeof schema>;

export function StaffFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['staff-member', id],
    enabled: isEdit,
    queryFn: async () => (await apiClient.get<StaffMember>(`/staff/${id}/`)).data,
  });

  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {},
  });

  useEffect(() => {
    if (data) {
      reset({
        employee_id: data.employee_id,
        designation: data.designation,
        phone: data.phone,
        user: data.user,
      });
    }
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = { ...values, branch: user?.branch };
      if (isEdit) {
        await apiClient.patch(`/staff/${id}/`, payload);
      } else {
        await apiClient.post('/staff/', payload);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['staff'] });
      navigate('/staff');
    },
  });

  if (isEdit && isLoading) {
    return <LoadingBlock />;
  }
  if (isEdit && isError) {
    return <ErrorBlock message="Failed to load staff record" />;
  }

  return (
    <>
      <PageHeader title={isEdit ? 'Edit staff' : 'Add staff'} breadcrumbs={[{ title: 'Staff' }]} />
      <Card>
        <Form layout="vertical" onFinish={handleSubmit((v) => mutation.mutate(v))}>
          <Controller name="employee_id" control={control} render={({ field }) => <Form.Item label="Employee ID"><Input {...field} autoFocus /></Form.Item>} />
          <Controller name="designation" control={control} render={({ field }) => <Form.Item label="Designation"><Input {...field} /></Form.Item>} />
          <Controller name="phone" control={control} render={({ field }) => <Form.Item label="Phone"><Input {...field} /></Form.Item>} />
          <Controller
            name="user"
            control={control}
            render={({ field }) => (
              <Form.Item label="Linked user ID (optional)">
                <InputNumber style={{ width: '100%' }} value={field.value ?? undefined} onChange={field.onChange} />
              </Form.Item>
            )}
          />
          <Button type="primary" htmlType="submit" loading={mutation.isPending}>Save</Button>
        </Form>
      </Card>
    </>
  );
}
