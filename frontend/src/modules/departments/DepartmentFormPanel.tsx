import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Form, Input, Popconfirm, Typography } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { apiClient } from '../../api/client';
import type { DepartmentRecord } from '../../api/types/models';
import { useAuth } from '../../auth/AuthContext';
import { ErrorBlock, LoadingBlock } from '../../components/QueryState';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export type DepartmentFormPanelProps = {
  apiPath: string;
  queryKey: string;
  departmentId?: number;
  entityLabel: string;
  autoFocusName?: boolean;
  onSuccess?: (record: DepartmentRecord, action: 'created' | 'updated') => void;
  onCancel?: () => void;
};

export function DepartmentFormPanel({
  apiPath,
  queryKey,
  departmentId,
  entityLabel,
  autoFocusName,
  onSuccess,
  onCancel,
}: DepartmentFormPanelProps) {
  const isEdit = Boolean(departmentId);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: [queryKey, departmentId],
    enabled: isEdit,
    queryFn: async () => (await apiClient.get<DepartmentRecord>(`${apiPath}${departmentId}/`)).data,
  });

  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', code: '' },
  });

  useEffect(() => {
    if (data) {
      reset({ name: data.name, code: data.code ?? '' });
    }
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = { ...values, branch: user?.branch };
      if (isEdit && departmentId) {
        const { data: updated } = await apiClient.patch<DepartmentRecord>(
          `${apiPath}${departmentId}/`,
          payload,
        );
        return updated;
      }
      const { data: created } = await apiClient.post<DepartmentRecord>(apiPath, payload);
      return created;
    },
    onSuccess: async (record) => {
      await queryClient.invalidateQueries({ queryKey: [queryKey] });
      if (!isEdit) {
        reset({ name: '', code: '' });
      }
      onSuccess?.(record, isEdit ? 'updated' : 'created');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!departmentId) {
        return;
      }
      await apiClient.delete(`${apiPath}${departmentId}/`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [queryKey] });
      onCancel?.();
    },
  });

  if (isEdit && isLoading) {
    return <LoadingBlock />;
  }
  if (isEdit && isError) {
    return <ErrorBlock message={`Failed to load ${entityLabel}`} />;
  }

  return (
    <form className="registration-form" onSubmit={handleSubmit((v) => mutation.mutate(v))}>
      <Typography.Title level={5} style={{ marginTop: 0 }}>
        {isEdit ? `Edit ${entityLabel}` : `New ${entityLabel}`}
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
          name="code"
          control={control}
          render={({ field }) => (
            <Form.Item label="Code" extra="Optional short code for reports">
              <Input {...field} />
            </Form.Item>
          )}
        />
      </Form>
      <div style={{ marginTop: 24 }}>
        <Button type="primary" htmlType="submit" loading={mutation.isPending}>
          {isEdit ? 'Save' : 'Add'}
        </Button>
        {onCancel && (
          <Button style={{ marginLeft: 8 }} htmlType="button" onClick={onCancel}>Cancel</Button>
        )}
        {isEdit && departmentId && (
          <Popconfirm
            title={`Remove this ${entityLabel}?`}
            description="It will be deactivated (soft delete)."
            onConfirm={() => deleteMutation.mutate()}
          >
            <Button danger style={{ marginLeft: 8 }} loading={deleteMutation.isPending}>
              Delete
            </Button>
          </Popconfirm>
        )}
      </div>
    </form>
  );
}
