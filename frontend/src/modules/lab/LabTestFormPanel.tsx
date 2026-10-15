import { zodResolver } from '@hookform/resolvers/zod';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Table,
  Typography,
  message,
} from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

import { apiClient } from '../../api/client';
import type {
  DepartmentRecord,
  LabTestCategory,
  LabTestRecord,
  LabTestTypeTier,
  Paginated,
} from '../../api/types/models';
import { useAuth } from '../../auth/AuthContext';
import { ErrorBlock, LoadingBlock } from '../../components/QueryState';
import { formatMoney } from '../patients/patientRegistrationSchema';
import { getRangeSectionMeta } from './labTestRangeSection';
import { LabTestResultEntryPreview } from './LabTestResultEntryPreview';

const testCategoryOptions: { value: LabTestCategory; label: string }[] = [
  { value: 'NORMAL', label: 'Normal' },
  { value: 'SUBTEST', label: 'Subtest' },
  { value: 'SPECIAL', label: 'Special test' },
  { value: 'MULTIPLE_REFERENCE', label: 'Has multiple reference range' },
];

const testTypeTierOptions: { value: LabTestTypeTier; label: string }[] = [
  'TYPE_1',
  'TYPE_2',
  'TYPE_3',
  'TYPE_4',
  'TYPE_5',
  'TYPE_6',
  'TYPE_7',
  'TYPE_8',
  'TYPE_9',
  'TYPE_10',
].map((value) => ({
  value: value as LabTestTypeTier,
  label: value.replace('TYPE_', 'Type-'),
}));

const emptyRange = () => ({
  reference_text: '',
  low_value: null as number | null,
  high_value: null as number | null,
  unit: '',
});

const emptyNote = () => ({ note: '' });

const schema = z.object({
  name: z.string().min(1, 'Test name is required'),
  code: z.string().optional(),
  method_name: z.string().optional(),
  test_category: z.enum(['NORMAL', 'SUBTEST', 'SPECIAL', 'MULTIPLE_REFERENCE']),
  test_type: z.enum([
    'TYPE_1',
    'TYPE_2',
    'TYPE_3',
    'TYPE_4',
    'TYPE_5',
    'TYPE_6',
    'TYPE_7',
    'TYPE_8',
    'TYPE_9',
    'TYPE_10',
  ]),
  department: z.number().nullable().optional(),
  default_rate: z.number().min(0),
  reference_ranges: z.array(
    z.object({
      reference_text: z.string().optional(),
      low_value: z.number().nullable().optional(),
      high_value: z.number().nullable().optional(),
      unit: z.string().optional(),
    }),
  ),
  interpretations: z.array(z.object({ note: z.string().optional() })),
});

type FormValues = z.infer<typeof schema>;

const defaultFormValues: FormValues = {
  name: '',
  code: '',
  method_name: '',
  test_category: 'NORMAL',
  test_type: 'TYPE_1',
  department: null,
  default_rate: 0,
  reference_ranges: [emptyRange()],
  interpretations: [emptyNote()],
};

export type LabTestFormPanelProps = {
  testId?: number;
  autoFocusName?: boolean;
  onTitleChange?: (title: string, dirty: boolean) => void;
  onSuccess?: (test: LabTestRecord, action: 'created' | 'updated') => void;
  onDeleted?: () => void;
};

export function LabTestFormPanel({
  testId,
  autoFocusName,
  onTitleChange,
  onSuccess,
  onDeleted,
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

  const { control, getValues, handleSubmit, reset, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultFormValues,
  });

  const {
    fields: rangeFields,
    append: appendRange,
    remove: removeRange,
  } = useFieldArray({ control, name: 'reference_ranges' });

  const {
    fields: noteFields,
    append: appendNote,
    remove: removeNote,
  } = useFieldArray({ control, name: 'interpretations' });

  const watchedName = watch('name');
  const watchedTestCategory = watch('test_category');
  const watchedMethod = watch('method_name');
  const watchedRanges = watch('reference_ranges');
  const watchedDepartment = watch('department');
  const watchedDepartmentName =
    departmentOptions.find((d) => d.value === watchedDepartment)?.label ?? '';
  const rangeSection = useMemo(
    () => getRangeSectionMeta(watchedTestCategory),
    [watchedTestCategory],
  );

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
    if (data) {
      reset({
        name: data.name,
        code: data.code ?? '',
        method_name: data.method_name ?? '',
        test_category: data.test_category ?? 'NORMAL',
        test_type: data.test_type || 'TYPE_1',
        department: data.department,
        default_rate: Number(data.default_rate),
        reference_ranges:
          data.reference_ranges?.length > 0
            ? data.reference_ranges.map((row) => ({
                reference_text: row.reference_text ?? '',
                low_value: row.low_value != null ? Number(row.low_value) : null,
                high_value: row.high_value != null ? Number(row.high_value) : null,
                unit: row.unit ?? '',
              }))
            : [emptyRange()],
        interpretations:
          data.interpretations?.length > 0
            ? data.interpretations.map((row) => ({ note: row.note ?? '' }))
            : [emptyNote()],
      });
    }
  }, [data, reset]);

  useEffect(() => {
    if (watchedTestCategory === 'SPECIAL') {
      setValue('reference_ranges', []);
      setValue('interpretations', []);
      return;
    }
    const ranges = getValues('reference_ranges');
    if (ranges.length === 0) {
      setValue('reference_ranges', [emptyRange()]);
      setValue('interpretations', [emptyNote()]);
    }
    if (watchedTestCategory !== 'NORMAL') {
      return;
    }
    const current = getValues('reference_ranges');
    if (current.length > 1) {
      setValue('reference_ranges', [current[0] ?? emptyRange()]);
    }
  }, [watchedTestCategory, getValues, setValue]);

  const isBillingOnly = watchedTestCategory === 'SPECIAL';

  const rangeColumns = useMemo(() => {
    const cols: Parameters<typeof Table>[0]['columns'] = [];
    if (rangeSection.showLabelColumn) {
      cols.push({
        title: rangeSection.textColumn,
        render: (_: unknown, __: unknown, index: number) => (
          <Controller
            name={`reference_ranges.${index}.reference_text`}
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder={watchedTestCategory === 'SUBTEST' ? 'Neutrophils' : 'Male'}
              />
            )}
          />
        ),
      });
    }
    cols.push(
      {
        title: 'Min',
        width: 100,
        render: (_: unknown, __: unknown, index: number) => (
          <Controller
            name={`reference_ranges.${index}.low_value`}
            control={control}
            render={({ field }) => (
              <InputNumber
                style={{ width: '100%' }}
                value={field.value ?? undefined}
                onChange={(val) => field.onChange(val ?? null)}
              />
            )}
          />
        ),
      },
      {
        title: 'Max',
        width: 100,
        render: (_: unknown, __: unknown, index: number) => (
          <Controller
            name={`reference_ranges.${index}.high_value`}
            control={control}
            render={({ field }) => (
              <InputNumber
                style={{ width: '100%' }}
                value={field.value ?? undefined}
                onChange={(val) => field.onChange(val ?? null)}
              />
            )}
          />
        ),
      },
      {
        title: 'Unit',
        width: 90,
        render: (_: unknown, __: unknown, index: number) => (
          <Controller
            name={`reference_ranges.${index}.unit`}
            control={control}
            render={({ field }) => <Input {...field} placeholder="mg/dL" />}
          />
        ),
      },
      {
        title: '',
        width: 48,
        render: (_: unknown, __: unknown, index: number) => (
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            disabled={!rangeSection.allowMultipleRows || rangeFields.length <= 1}
            onClick={() => removeRange(index)}
            aria-label="Remove row"
          />
        ),
      },
    );
    return cols;
  }, [
    control,
    rangeFields.length,
    rangeSection,
    removeRange,
    watchedTestCategory,
  ]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const billingOnly = values.test_category === 'SPECIAL';
      const payload = {
        ...values,
        test_type: values.test_type || 'TYPE_1',
        branch: user?.branch,
        reference_ranges: billingOnly
          ? []
          : values.reference_ranges.map((row) => ({
          reference_text: row.reference_text ?? '',
          low_value: row.low_value,
          high_value: row.high_value,
          unit: row.unit ?? '',
        })),
        interpretations: billingOnly
          ? []
          : values.interpretations.map((row) => ({
              note: row.note ?? '',
            })),
      };
      if (isEdit && testId) {
        const { data: updated } = await apiClient.patch<LabTestRecord>(`/lab/tests/${testId}/`, payload);
        return updated;
      }
      const { data: created } = await apiClient.post<LabTestRecord>('/lab/tests/', payload);
      return created;
    },
    onSuccess: async (test) => {
      message.success(isEdit ? 'Test saved' : 'Test created');
      await queryClient.invalidateQueries({ queryKey: ['lab-tests'] });
      onSuccess?.(test, isEdit ? 'updated' : 'created');
    },
    onError: () => message.error('Could not save test'),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!testId) {
        return;
      }
      await apiClient.delete(`/lab/tests/${testId}/`);
    },
    onSuccess: async () => {
      message.success('Test removed');
      await queryClient.invalidateQueries({ queryKey: ['lab-tests'] });
      onDeleted?.();
    },
  });

  if (isEdit && isLoading) {
    return <LoadingBlock />;
  }
  if (isEdit && isError) {
    return <ErrorBlock message="Failed to load test" />;
  }

  return (
    <form className="lab-test-form" onSubmit={handleSubmit((v) => mutation.mutate(v))}>
      <div className="billing-form-section">
        <Typography.Text strong className="billing-form-section-title">Test details</Typography.Text>
        <Form layout="vertical" component={false}>
          <div className="lab-test-details-grid">
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <Form.Item
                className="lab-test-details-grid-span"
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
            render={({ field }) => (
              <Form.Item label="Test code">
                <Input {...field} />
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
            name="test_category"
            control={control}
            render={({ field }) => (
              <Form.Item label="Test category">
                <Select {...field} options={testCategoryOptions} />
              </Form.Item>
            )}
          />
          <Controller
            name="test_type"
            control={control}
            render={({ field }) => (
              <Form.Item label="Test type">
                <Select {...field} options={testTypeTierOptions} />
              </Form.Item>
            )}
          />
          <Controller
            name="method_name"
            control={control}
            render={({ field }) => (
              <Form.Item label="Method name">
                <Input {...field} />
              </Form.Item>
            )}
          />
          <Controller
            name="default_rate"
            control={control}
            render={({ field }) => (
              <Form.Item label="Amount (₹)">
                <InputNumber style={{ width: '100%' }} min={0} step={10} {...field} />
              </Form.Item>
            )}
          />
          </div>
        </Form>
        {isBillingOnly && (
          <Typography.Paragraph type="secondary" className="lab-test-billing-only-hint">
            Billing-only test (e.g. X-ray, ultrasound). No reference ranges or result entry — use
            name, code, department, and amount for billing.
          </Typography.Paragraph>
        )}
      </div>

      {rangeSection.showSection && (
      <div className="billing-form-section">
        <Typography.Text strong className="billing-form-section-title">
          {rangeSection.title}
        </Typography.Text>
        <Typography.Paragraph type="secondary" className="billing-add-test-hint">
          {rangeSection.hint}
        </Typography.Paragraph>
        <Table
          className="billing-tests-table lab-test-ranges-table"
          size="small"
          pagination={false}
          rowKey="id"
          dataSource={rangeFields}
          footer={
            rangeSection.allowMultipleRows
              ? () => (
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => appendRange(emptyRange())}
                  >
                    {rangeSection.addLabel}
                  </Button>
                )
              : undefined
          }
          columns={rangeColumns}
        />
      </div>
      )}

      {!isBillingOnly && (
      <div className="billing-form-section lab-result-preview-section">
        <LabTestResultEntryPreview
          layout={data?.result_entry_layout}
          testCategory={watchedTestCategory}
          title={watchedName}
          methodName={watchedMethod ?? ''}
          departmentName={watchedDepartmentName}
          draftRanges={watchedRanges}
        />
      </div>
      )}

      {!isBillingOnly && (
      <div className="billing-form-section">
        <Typography.Text strong className="billing-form-section-title">
          Interpretation / notes
        </Typography.Text>
        <div className="lab-test-notes-list">
          {noteFields.map((field, index) => (
            <div key={field.id} className="lab-test-note-row">
              <Controller
                name={`interpretations.${index}.note`}
                control={control}
                render={({ field: noteField }) => (
                  <Input.TextArea
                    {...noteField}
                    rows={3}
                    placeholder={`Note ${index + 1}`}
                  />
                )}
              />
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                disabled={noteFields.length <= 1}
                onClick={() => removeNote(index)}
                aria-label="Remove note"
              />
            </div>
          ))}
          <Button type="dashed" icon={<PlusOutlined />} onClick={() => appendNote(emptyNote())}>
            Add note
          </Button>
        </div>
      </div>
      )}

      <div className="lab-test-form-actions">
        <Button type="primary" htmlType="submit" loading={mutation.isPending}>
          {isEdit ? 'Save' : 'Add test'}
        </Button>
        {isEdit && testId && (
          <Popconfirm
            title="Remove this test?"
            description="The test will be deactivated (soft delete)."
            onConfirm={() => deleteMutation.mutate()}
          >
            <Button danger loading={deleteMutation.isPending}>
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
  search = '',
  embedded = false,
}: {
  selectedTestId?: number;
  onSelectTest: (id: number) => void;
  search?: string;
  embedded?: boolean;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['lab-tests', 'panel', search],
    queryFn: async () => {
      const { data: res } = await apiClient.get<Paginated<LabTestRecord>>('/lab/tests/', {
        params: { search: search || undefined, page_size: 50 },
      });
      return res.results;
    },
  });

  if (isLoading) {
    return <LoadingBlock />;
  }
  if (isError) {
    return <ErrorBlock message="Could not load tests" />;
  }

  const list = (
    <div className="doctor-list-panel-scroll">
      {(data ?? []).length === 0 ? (
        <Typography.Text type="secondary">No tests found</Typography.Text>
      ) : null}
      {(data ?? []).map((test) => {
        const method = test.method_name?.trim() ?? '';
        let codeMethodLine: string | null = null;
        if (test.code) {
          codeMethodLine = `Code: ${test.code}`;
          if (method) {
            codeMethodLine += ` - Method: ${method}`;
          }
        } else if (method) {
          codeMethodLine = `Method: ${method}`;
        }
        const dept = test.department_detail?.name?.trim() ?? '';
        const amount = formatMoney(Number(test.default_rate));

        return (
          <Card
            key={test.id}
            size="small"
            hoverable
            className={`doctor-list-card lab-test-list-card${selectedTestId === test.id ? ' doctor-list-card--selected' : ''}`}
            onClick={() => onSelectTest(test.id)}
          >
            <Typography.Text strong className="doctor-list-card-name">{test.name}</Typography.Text>
            {codeMethodLine ? (
              <Typography.Text type="secondary" className="doctor-list-card-meta">
                {codeMethodLine}
              </Typography.Text>
            ) : null}
            <div className="lab-test-list-card-dept-row">
              <Typography.Text type="secondary" className="doctor-list-card-meta">
                {dept || '—'}
              </Typography.Text>
              <Typography.Text type="secondary" className="doctor-list-card-meta lab-test-list-card-amount">
                {amount}
              </Typography.Text>
            </div>
          </Card>
        );
      })}
    </div>
  );

  if (embedded) {
    return list;
  }

  return (
    <aside className="doctor-list-panel" aria-label="Lab tests">
      <Typography.Title level={5} style={{ marginTop: 0 }}>Tests</Typography.Title>
      {list}
    </aside>
  );
}
