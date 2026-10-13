import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, Form, Input, InputNumber, Popconfirm, Select, Typography } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { apiClient } from '../../api/client';
import type { DepartmentRecord, LabTestRecord, Paginated } from '../../api/types/models';
import { useAuth } from '../../auth/AuthContext';
import { ErrorBlock, LoadingBlock } from '../../components/QueryState';
import { formatMoney } from '../patients/patientRegistrationSchema';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().optional(),
  department: z.number().nullable().optional(),
  default_rate: z.number().min(0),
});

type FormValues = z.infer<typeof schema>;

export type LabTestFormPanelProps = {
  testId?: number;
  autoFocusName?: boolean;
  onSuccess?: (test: LabTestRecord, action: 'created' | 'updated') => void;
  onCancel?: () => void;
};

export function LabTestFormPanel({
  testId,
  autoFocusName,
  onSuccess,
  onCancel,
}: LabTestFormPanelProps) {
  const isEdit = Boolean(testId);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['lab-test', testId],
    enabled: isEdit,
    queryFn: async () => (await apiClient.get<LabTestRecord>(`/lab/tests/${testId}/`)).data,
  });

  const departmentsQuery = useQuery({
    queryKey: ['lab-test-departments', 'options'],
    queryFn: async () => {
      const { data: res } = await apiClient.get<Paginated<DepartmentRecord>>('/lab/test-departments/');
      return res.results;
    },
  });

  const departmentOptions = (departmentsQuery.data ?? []).map((d) => ({
    value: d.id,
    label: d.code ? `${d.name} (${d.code})` : d.name,
  }));

  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', code: '', department: null, default_rate: 0 },
  });

  useEffect(() => {
    if (data) {
      reset({
        name: data.name,
        code: data.code ?? '',
        department: data.department,
        default_rate: Number(data.default_rate),
      });
    }
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = { ...values, branch: user?.branch };
      if (isEdit && testId) {
        const { data: updated } = await apiClient.patch<LabTestRecord>(`/lab/tests/${testId}/`, payload);
        return updated;
      }
      const { data: created } = await apiClient.post<LabTestRecord>('/lab/tests/', payload);
      return created;
    },
    onSuccess: async (test) => {
      await queryClient.invalidateQueries({ queryKey: ['lab-tests'] });
      onSuccess?.(test, isEdit ? 'updated' : 'created');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!testId) {
        return;
      }
      await apiClient.delete(`/lab/tests/${testId}/`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['lab-tests'] });
      onCancel?.();
    },
  });

  if (isEdit && isLoading) {
    return <LoadingBlock />;
  }
  if (isEdit && isError) {
    return <ErrorBlock message="Failed to load test" />;
  }

  return (
    <form className="registration-form" onSubmit={handleSubmit((v) => mutation.mutate(v))}>
      <Typography.Title level={5} style={{ marginTop: 0 }}>
        {isEdit ? 'Edit test' : 'New test'}
      </Typography.Title>
      <Form layout="vertical" component={false}>
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState }) => (
            <Form.Item
              label="Test name"
              required
              validateStatus={fieldState.error ? 'error' : ''}
              help={fieldState.error?.message}
            >
              <Input {...field} autoFocus={autoFocusName} />
            </Form.Item>
          )}
        />
        <Controller
          name="code"
          control={control}
          render={({ field }) => <Form.Item label="Code"><Input {...field} /></Form.Item>}
        />
        <Controller
          name="department"
          control={control}
          render={({ field }) => (
            <Form.Item label="Test department">
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
          name="default_rate"
          control={control}
          render={({ field }) => (
            <Form.Item label="Default rate (₹)">
              <InputNumber style={{ width: '100%' }} min={0} step={10} {...field} />
            </Form.Item>
          )}
        />
      </Form>
      <div style={{ marginTop: 24 }}>
        <Button type="primary" htmlType="submit" loading={mutation.isPending}>
          {isEdit ? 'Save' : 'Add test'}
        </Button>
        {onCancel && (
          <Button style={{ marginLeft: 8 }} htmlType="button" onClick={onCancel}>Cancel</Button>
        )}
        {isEdit && testId && (
          <Popconfirm
            title="Remove this test?"
            description="The test will be deactivated (soft delete)."
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

export function LabTestListPanel({
  selectedTestId,
  onSelectTest,
}: {
  selectedTestId?: number;
  onSelectTest: (id: number) => void;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['lab-tests', 'panel'],
    queryFn: async () => {
      const { data: res } = await apiClient.get<Paginated<LabTestRecord>>('/lab/tests/');
      return res.results;
    },
  });

  if (isLoading) {
    return <LoadingBlock />;
  }
  if (isError) {
    return <ErrorBlock message="Could not load tests" />;
  }

  return (
    <aside className="doctor-list-panel" aria-label="Lab tests">
      <Typography.Title level={5} style={{ marginTop: 0 }}>Tests</Typography.Title>
      <div className="doctor-list-panel-scroll">
        {(data ?? []).map((test) => (
          <Card
            key={test.id}
            size="small"
            hoverable
            className={`doctor-list-card${selectedTestId === test.id ? ' doctor-list-card--selected' : ''}`}
            onClick={() => onSelectTest(test.id)}
          >
            <Typography.Text strong className="doctor-list-card-name">{test.name}</Typography.Text>
            {test.department_detail?.name ? (
              <Typography.Text type="secondary" className="doctor-list-card-meta">
                {test.department_detail.name}
              </Typography.Text>
            ) : null}
            <Typography.Text type="secondary" className="doctor-list-card-meta">
              {formatMoney(Number(test.default_rate))}
            </Typography.Text>
          </Card>
        ))}
      </div>
    </aside>
  );
}
