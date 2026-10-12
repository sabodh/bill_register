import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, Form, Input, Select, Switch } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import { apiClient } from '../../api/client';
import type { RoleRecord, UserRecord } from '../../api/types/models';
import { useAuth } from '../../auth/AuthContext';
import { PageHeader } from '../../components/PageHeader';
import { ErrorBlock, LoadingBlock } from '../../components/QueryState';

const schema = z.object({
  username: z.string().min(1),
  password: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(),
  is_active: z.boolean(),
  role_ids: z.array(z.number()).min(1, 'Select at least one role'),
});

type FormValues = z.infer<typeof schema>;

export function UserFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const rolesQuery = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ results: RoleRecord[] }>('/roles/');
      return data.results;
    },
  });

  const userQuery = useQuery({
    queryKey: ['user', id],
    enabled: isEdit,
    queryFn: async () => {
      const { data } = await apiClient.get<UserRecord>(`/users/${id}/`);
      return data;
    },
  });

  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', is_active: true, role_ids: [] },
  });

  useEffect(() => {
    if (userQuery.data) {
      reset({
        username: userQuery.data.username,
        email: userQuery.data.email,
        first_name: userQuery.data.first_name,
        last_name: userQuery.data.last_name,
        phone: userQuery.data.phone,
        is_active: userQuery.data.is_active,
        role_ids: userQuery.data.role_ids,
      });
    }
  }, [userQuery.data, reset]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = { ...values, branch: user?.branch };
      if (isEdit) {
        await apiClient.patch(`/users/${id}/`, payload);
      } else {
        await apiClient.post('/users/', payload);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      navigate('/users');
    },
  });

  if (isEdit && userQuery.isLoading) {
    return <LoadingBlock />;
  }
  if (isEdit && userQuery.isError) {
    return <ErrorBlock message="Failed to load user" />;
  }

  return (
    <>
      <PageHeader title={isEdit ? 'Edit user' : 'New user'} breadcrumbs={[{ title: 'Users' }]} />
      <Card>
        <Form layout="vertical" onFinish={handleSubmit((v) => mutation.mutate(v))}>
          <Controller
            name="username"
            control={control}
            render={({ field, fieldState }) => (
              <Form.Item label="Username" validateStatus={fieldState.error ? 'error' : ''} help={fieldState.error?.message}>
                <Input {...field} autoFocus disabled={isEdit} />
              </Form.Item>
            )}
          />
          {!isEdit && (
            <Controller
              name="password"
              control={control}
              render={({ field }) => <Form.Item label="Password"><Input.Password {...field} /></Form.Item>}
            />
          )}
          <Controller
            name="role_ids"
            control={control}
            render={({ field, fieldState }) => (
              <Form.Item label="Roles" validateStatus={fieldState.error ? 'error' : ''} help={fieldState.error?.message}>
                <Select
                  mode="multiple"
                  value={field.value}
                  onChange={field.onChange}
                  options={rolesQuery.data?.map((r) => ({ value: r.id, label: r.name }))}
                />
              </Form.Item>
            )}
          />
          <Controller
            name="is_active"
            control={control}
            render={({ field }) => (
              <Form.Item label="Active">
                <Switch checked={field.value} onChange={field.onChange} />
              </Form.Item>
            )}
          />
          <Button type="primary" htmlType="submit" loading={mutation.isPending}>Save</Button>
        </Form>
      </Card>
    </>
  );
}
