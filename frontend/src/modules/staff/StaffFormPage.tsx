import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, Form, Input, Select, Typography } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import { apiClient } from '../../api/client';
import type { DepartmentRecord, Paginated, StaffMember } from '../../api/types/models';
import { useAuth } from '../../auth/AuthContext';
import { PageHeader } from '../../components/PageHeader';
import { ErrorBlock, LoadingBlock } from '../../components/QueryState';

const schema = z.object({
  employee_id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  address: z.string().optional(),
  gender: z.enum(['M', 'F', 'O']).optional(),
  date_of_birth: z.string().optional(),
  phone: z.string().optional(),
  alternative_phone: z.string().optional(),
  department: z.number().nullable().optional(),
  aadhar_number: z
    .string()
    .optional()
    .refine((v) => !v || /^\d{12}$/.test(v), 'Aadhaar must be 12 digits'),
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

  const departmentsQuery = useQuery({
    queryKey: ['staff-departments', 'options'],
    queryFn: async () => {
      const { data: res } = await apiClient.get<Paginated<DepartmentRecord>>('/staff-departments/');
      return res.results;
    },
  });

  const departmentOptions = (departmentsQuery.data ?? []).map((d) => ({
    value: d.id,
    label: d.code ? `${d.name} (${d.code})` : d.name,
  }));

  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      gender: 'M',
      employee_id: '',
      address: '',
      phone: '',
      alternative_phone: '',
      aadhar_number: '',
      department: null,
    },
  });

  useEffect(() => {
    if (data) {
      reset({
        employee_id: data.employee_id ?? '',
        name: data.name ?? '',
        address: data.address ?? '',
        gender: (data.gender || 'M') as 'M' | 'F' | 'O',
        date_of_birth: data.date_of_birth ?? '',
        phone: data.phone ?? '',
        alternative_phone: data.alternative_phone ?? '',
        department: data.department,
        aadhar_number: data.aadhar_number ?? '',
      });
    }
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        ...values,
        date_of_birth: values.date_of_birth || null,
        branch: user?.branch,
      };
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
      <Card className="staff-form-card" styles={{ body: { maxWidth: 28 * 16 } }}>
        <form className="registration-form" onSubmit={handleSubmit((v) => mutation.mutate(v))}>
          <Typography.Title level={5} style={{ marginTop: 0 }}>
            {isEdit ? 'Edit staff' : 'New staff'}
          </Typography.Title>
          <Form layout="vertical" component={false}>
            <Controller
              name="employee_id"
              control={control}
              render={({ field }) => (
                <Form.Item label="Employee ID">
                  <Input {...field} autoFocus={!isEdit} />
                </Form.Item>
              )}
            />
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Name"
                  required
                  validateStatus={fieldState.error ? 'error' : ''}
                  help={fieldState.error?.message}
                >
                  <Input {...field} autoFocus={isEdit} />
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
              render={({ field }) => (
                <Form.Item label="Mobile">
                  <Input {...field} inputMode="tel" />
                </Form.Item>
              )}
            />
            <Controller
              name="alternative_phone"
              control={control}
              render={({ field }) => (
                <Form.Item label="Alternative number">
                  <Input {...field} inputMode="tel" />
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
              name="aadhar_number"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Aadhaar no."
                  validateStatus={fieldState.error ? 'error' : ''}
                  help={fieldState.error?.message}
                >
                  <Input {...field} maxLength={12} inputMode="numeric" />
                </Form.Item>
              )}
            />
          </Form>
          <div style={{ marginTop: 24 }}>
            <Button type="primary" htmlType="submit" loading={mutation.isPending}>Save</Button>
            <Button style={{ marginLeft: 8 }} htmlType="button" onClick={() => navigate('/staff')}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
