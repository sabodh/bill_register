import {
  AutoComplete,
  Button,
  DatePicker,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Table,
  Typography,
  message,
} from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';

import { apiClient } from '../../api/client';
import type { BillingItem, Branch, Doctor, Paginated, Patient } from '../../api/types/models';
import { useAuth } from '../../auth/AuthContext';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

function formatAgeSex(patient: Patient) {
  const agePart = patient.age_years != null ? `${patient.age_years}y` : '—';
  const sex = { M: 'male', F: 'female', O: 'other' }[patient.gender];
  return `${agePart} / ${sex}`;
}

type GridLine = {
  key: string;
  billing_item: number | null;
  description: string;
  quantity: number;
  unit_price: number;
};

function lineAmount(line: GridLine) {
  return Number((line.quantity * line.unit_price).toFixed(2));
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
}

type DiscountType = 'NONE' | 'PERCENT' | 'AMOUNT';
type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'CREDIT';

function computeBillTotals(
  subtotal: number,
  discountType: DiscountType,
  discountPercent: number,
  discountAmount: number,
) {
  let discountApplied = 0;
  let fromPercent = 0;
  if (discountType === 'PERCENT') {
    fromPercent = Number(((subtotal * discountPercent) / 100).toFixed(2));
    discountApplied = Math.min(subtotal, fromPercent);
  } else if (discountType === 'AMOUNT') {
    discountApplied = Math.min(subtotal, Number(discountAmount.toFixed(2)));
  }
  const total = Number((subtotal - discountApplied).toFixed(2));
  return { subtotal, fromPercent, discountApplied, total };
}

type BillingPanelProps = {
  onTitleChange?: (title: string, dirty: boolean) => void;
  onSuccess?: () => void;
};

export function BillingPanel({ onTitleChange, onSuccess }: BillingPanelProps) {
  const { user } = useAuth();
  const defaultHospitalId = user?.branch ?? null;

  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [hospitalId, setHospitalId] = useState<number | null>(defaultHospitalId);
  const [hospitalSearch, setHospitalSearch] = useState(() => user?.branch_detail?.name ?? '');
  const [sampleCollectedAt, setSampleCollectedAt] = useState<Dayjs>(() => dayjs());

  const [search, setSearch] = useState('');
  const [lines, setLines] = useState<GridLine[]>([]);
  const [discountType, setDiscountType] = useState<DiscountType>('NONE');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paymentTransactionId, setPaymentTransactionId] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const debouncedPatientSearch = useDebouncedValue(patientSearch, 300);
  const debouncedDoctorSearch = useDebouncedValue(doctorSearch, 300);
  const debouncedHospitalSearch = useDebouncedValue(hospitalSearch, 300);

  const patientsQuery = useQuery({
    queryKey: ['patients', 'billing-lookup', debouncedPatientSearch],
    enabled: debouncedPatientSearch.trim().length >= 2,
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<Patient>>('/patients/', {
        params: { lookup: debouncedPatientSearch.trim(), page_size: 15 },
      });
      return data.results;
    },
  });

  const doctorsQuery = useQuery({
    queryKey: ['doctors', debouncedDoctorSearch],
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<Doctor>>('/doctors/', {
        params: { search: debouncedDoctorSearch || undefined, page_size: 20 },
      });
      return data.results;
    },
  });

  const branchesQuery = useQuery({
    queryKey: ['branches', debouncedHospitalSearch],
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<Branch>>('/branches/', {
        params: { search: debouncedHospitalSearch || undefined, page_size: 20 },
      });
      return data.results;
    },
  });

  const patientOptions = useMemo(
    () =>
      (patientsQuery.data ?? []).map((patient) => ({
        value: String(patient.id),
        label: [
          patient.name,
          patient.op_token != null ? `OP ${patient.op_token}` : null,
          patient.phone ? patient.phone : null,
          patient.uhid,
        ]
          .filter(Boolean)
          .join(' · '),
        patient,
      })),
    [patientsQuery.data],
  );

  const doctorOptions = useMemo(
    () =>
      (doctorsQuery.data ?? []).map((doc) => ({
        value: String(doc.id),
        label: doc.specialization ? `${doc.name} — ${doc.specialization}` : doc.name,
        doctor: doc,
      })),
    [doctorsQuery.data],
  );

  const hospitalOptions = useMemo(
    () =>
      (branchesQuery.data ?? []).map((branch) => ({
        value: String(branch.id),
        label: branch.name,
        branch,
      })),
    [branchesQuery.data],
  );

  const itemsQuery = useQuery({
    queryKey: ['billing-items', debouncedSearch],
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<BillingItem>>('/billing/items/', {
        params: { search: debouncedSearch || undefined, page_size: 20 },
      });
      return data.results;
    },
  });

  const selectedBillingItemIds = useMemo(
    () => new Set(lines.map((row) => row.billing_item).filter((id): id is number => id != null)),
    [lines],
  );

  const options = useMemo(
    () =>
      (itemsQuery.data ?? []).map((item) => {
        const alreadyAdded = selectedBillingItemIds.has(item.id);
        return {
          value: String(item.id),
          label: alreadyAdded
            ? `${item.name} — ${formatMoney(Number(item.default_rate))} (already added)`
            : `${item.name} — ${formatMoney(Number(item.default_rate))}`,
          item,
          disabled: alreadyAdded,
        };
      }),
    [itemsQuery.data, selectedBillingItemIds],
  );

  const addLineFromItem = (item: BillingItem) => {
    setLines((prev) => {
      if (prev.some((row) => row.billing_item === item.id)) {
        message.warning(`"${item.name}" is already on this bill. Change quantity on that row.`);
        return prev;
      }
      return [
        ...prev,
        {
          key: `row-${item.id}-${Date.now()}`,
          billing_item: item.id,
          description: item.name,
          quantity: 1,
          unit_price: Number(item.default_rate),
        },
      ];
    });
    setSearch('');
  };

  const updateLine = (key: string, patch: Partial<GridLine>) => {
    setLines((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  const removeLine = (key: string) => {
    setLines((prev) => prev.filter((row) => row.key !== key));
  };

  const subtotal = useMemo(() => lines.reduce((sum, row) => sum + lineAmount(row), 0), [lines]);
  const totals = useMemo(
    () => computeBillTotals(subtotal, discountType, discountPercent, discountAmount),
    [subtotal, discountType, discountPercent, discountAmount],
  );

  const needsTransactionId = paymentMethod === 'UPI' || paymentMethod === 'CARD';

  const hasDraft =
    selectedPatient !== null ||
    lines.length > 0 ||
    discountType !== 'NONE' ||
    paymentMethod !== 'CASH' ||
    paymentTransactionId.trim() !== '' ||
    search.trim() !== '' ||
    patientSearch.trim() !== '';

  const resetBillForm = () => {
    setSelectedPatient(null);
    setPatientSearch('');
    setDoctorId(null);
    setDoctorSearch('');
    setHospitalId(defaultHospitalId);
    setHospitalSearch(user?.branch_detail?.name ?? '');
    setSampleCollectedAt(dayjs());
    setLines([]);
    setDiscountType('NONE');
    setDiscountPercent(0);
    setDiscountAmount(0);
    setPaymentMethod('CASH');
    setPaymentTransactionId('');
    setSearch('');
  };

  const selectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientSearch(`${patient.uhid} — ${patient.name}`);
    if (patient.doctor) {
      setDoctorId(patient.doctor);
      if (patient.doctor_detail) {
        setDoctorSearch(patient.doctor_detail.name);
      }
    }
  };

  const onTitleChangeRef = useRef(onTitleChange);
  onTitleChangeRef.current = onTitleChange;
  const lastTitleReport = useRef<{ title: string; dirty: boolean } | null>(null);

  useEffect(() => {
    const dirty = hasDraft;
    const title = selectedPatient?.name.trim() || lines[0]?.description?.trim() || '';
    const prev = lastTitleReport.current;
    if (prev && prev.title === title && prev.dirty === dirty) {
      return;
    }
    lastTitleReport.current = { title, dirty };
    onTitleChangeRef.current?.(title, dirty);
  }, [hasDraft, lines, selectedPatient]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPatient) {
        throw new Error('Select a patient');
      }
      if (lines.length === 0) {
        throw new Error('Add at least one test');
      }
      if (needsTransactionId && !paymentTransactionId.trim()) {
        throw new Error('Transaction ID is required for UPI and Card');
      }
      await apiClient.post('/billing/bills/', {
        patient: selectedPatient.id,
        doctor: doctorId,
        doctor_name: doctorSearch.trim(),
        hospital: hospitalId,
        hospital_name: hospitalSearch.trim(),
        sample_collected_at: sampleCollectedAt.toISOString(),
        discount_type: discountType,
        discount_percent: discountType === 'PERCENT' ? discountPercent : 0,
        discount_amount: discountType === 'AMOUNT' ? discountAmount : 0,
        payment_method: paymentMethod,
        payment_transaction_id: needsTransactionId ? paymentTransactionId.trim() : '',
        lines: lines.map((row) => ({
          billing_item: row.billing_item,
          description: row.description,
          quantity: row.quantity,
          unit_price: row.unit_price,
        })),
      });
    },
    onSuccess: () => {
      message.success('Bill saved');
      onSuccess?.();
    },
    onError: () => message.error('Could not save bill'),
  });

  return (
    <>
      <div className="billing-form-section">
        <Typography.Text strong className="billing-form-section-title">Patient</Typography.Text>
        <AutoComplete
          style={{ width: '100%', maxWidth: 520 }}
          value={patientSearch}
          options={patientOptions}
          onSearch={(value) => {
            setPatientSearch(value);
            if (!value.trim()) {
              setSelectedPatient(null);
            }
          }}
          onSelect={(value) => {
            const match = patientOptions.find((o) => o.value === value);
            if (match) {
              selectPatient(match.patient);
            }
          }}
          placeholder="OP token, phone, UHID, or name"
          notFoundContent={
            debouncedPatientSearch.trim().length < 2
              ? 'Type at least 2 characters'
              : patientsQuery.isLoading
                ? 'Loading…'
                : 'No patients found'
          }
          allowClear
          onClear={() => {
            setSelectedPatient(null);
            setPatientSearch('');
          }}
        />
        {selectedPatient && (
          <div className="billing-patient-summary">
            <dl className="billing-patient-summary-col">
              <dt>Name</dt>
              <dd>{selectedPatient.name}</dd>
            </dl>
            <dl className="billing-patient-summary-col">
              <dt>Age</dt>
              <dd>{formatAgeSex(selectedPatient)}</dd>
              <dt>Phone</dt>
              <dd>{selectedPatient.phone || '—'}</dd>
            </dl>
            <dl className="billing-patient-summary-address">
              <dt>Address</dt>
              <dd>{selectedPatient.address || '—'}</dd>
            </dl>
          </div>
        )}
        <div className="billing-context-grid">
          <div className="billing-context-field">
            <Typography.Text type="secondary" className="billing-grid-label">
              Doctor
            </Typography.Text>
            <AutoComplete
              style={{ width: '100%' }}
              value={doctorSearch}
              options={doctorOptions}
              onSearch={(value) => {
                setDoctorSearch(value);
                setDoctorId(null);
              }}
              onSelect={(value) => {
                const match = doctorOptions.find((o) => o.value === value);
                if (match) {
                  setDoctorId(match.doctor.id);
                  setDoctorSearch(match.doctor.name);
                }
              }}
              placeholder="Type or pick a doctor"
              notFoundContent={doctorsQuery.isLoading ? 'Loading…' : null}
              allowClear
              onClear={() => {
                setDoctorSearch('');
                setDoctorId(null);
              }}
            />
          </div>
          <div className="billing-context-field">
            <Typography.Text type="secondary" className="billing-grid-label">
              Hospital
            </Typography.Text>
            <AutoComplete
              style={{ width: '100%' }}
              value={hospitalSearch}
              options={hospitalOptions}
              onSearch={(value) => {
                setHospitalSearch(value);
                setHospitalId(null);
              }}
              onSelect={(value) => {
                const match = hospitalOptions.find((o) => o.value === value);
                if (match) {
                  setHospitalId(match.branch.id);
                  setHospitalSearch(match.branch.name);
                }
              }}
              placeholder="Type or pick a hospital"
              notFoundContent={branchesQuery.isLoading ? 'Loading…' : null}
              allowClear
              onClear={() => {
                setHospitalSearch('');
                setHospitalId(null);
              }}
            />
          </div>
          <div className="billing-context-field">
            <Typography.Text type="secondary" className="billing-grid-label">
              Sample collected
            </Typography.Text>
            <DatePicker
              showTime
              format="DD MMM YYYY, hh:mm A"
              value={sampleCollectedAt}
              onChange={(value) => value && setSampleCollectedAt(value)}
            />
          </div>
        </div>
      </div>

      <div className="billing-form-section">
        <Typography.Text strong className="billing-form-section-title">Add test</Typography.Text>
        <AutoComplete
          style={{ width: '100%', maxWidth: 520 }}
          options={options}
          value={search}
          onSearch={setSearch}
          onSelect={(value) => {
            const match = options.find((o) => o.value === value);
            if (match) {
              addLineFromItem(match.item);
            }
          }}
          placeholder="Search test name or code"
          notFoundContent={itemsQuery.isLoading ? 'Loading…' : 'No tests found'}
          onFocus={() => itemsQuery.refetch()}
        />
        <Typography.Paragraph type="secondary" className="billing-add-test-hint">
          Pick a test to add it under Tests selected.
        </Typography.Paragraph>
      </div>

      <Table
        className="billing-tests-table"
        size="small"
        rowKey="key"
        dataSource={lines}
        pagination={false}
        title={() => <Typography.Text strong>Tests selected</Typography.Text>}
        locale={{ emptyText: 'No tests selected — search and add a test above' }}
        footer={() => (
          <div className="billing-table-footer">
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() =>
                setLines((prev) => [
                  ...prev,
                  {
                    key: `manual-${Date.now()}`,
                    billing_item: null,
                    description: 'Custom test',
                    quantity: 1,
                    unit_price: 0,
                  },
                ])
              }
            >
              Add empty row
            </Button>
            <div className="billing-checkout-grid">
              <div className="billing-grid-left billing-checkout-payment-col">
                <div>
                  <Typography.Text type="secondary" className="billing-grid-label">
                    Payment method
                  </Typography.Text>
                  <Select
                    value={paymentMethod}
                    onChange={(val: PaymentMethod) => {
                      setPaymentMethod(val);
                      if (val !== 'UPI' && val !== 'CARD') {
                        setPaymentTransactionId('');
                      }
                    }}
                    options={[
                      { value: 'CASH', label: 'Cash' },
                      { value: 'UPI', label: 'UPI' },
                      { value: 'CARD', label: 'Card' },
                      { value: 'CREDIT', label: 'Credit' },
                    ]}
                  />
                </div>
                {needsTransactionId && (
                  <div>
                    <Typography.Text type="secondary" className="billing-grid-label">
                      Transaction ID
                    </Typography.Text>
                    <Input
                      value={paymentTransactionId}
                      onChange={(e) => setPaymentTransactionId(e.target.value)}
                      placeholder="Reference number"
                    />
                  </div>
                )}
                <Space className="billing-checkout-actions" wrap>
                  <Button
                    type="primary"
                    size="middle"
                    onClick={() => saveMutation.mutate()}
                    loading={saveMutation.isPending}
                    disabled={lines.length === 0 || !selectedPatient}
                  >
                    Save
                  </Button>
                  <Popconfirm
                    title="Discard this bill?"
                    description="Tests selected, discount, and payment details will be cleared."
                    okText="Discard"
                    cancelText="Keep editing"
                    okButtonProps={{ size: 'middle' }}
                    cancelButtonProps={{ size: 'middle' }}
                    classNames={{ root: 'billing-discard-popconfirm' }}
                    onConfirm={resetBillForm}
                    disabled={!hasDraft || saveMutation.isPending}
                  >
                    <Button size="middle" disabled={!hasDraft || saveMutation.isPending}>
                      Cancel
                    </Button>
                  </Popconfirm>
                </Space>
              </div>
              <div className="billing-grid-right billing-checkout-totals-col">
                <div className="billing-amount-line">
                  <span>Subtotal</span>
                  <strong>{formatMoney(totals.subtotal)}</strong>
                </div>
                <div className="billing-discount-cell">
                  <div className="billing-amount-line billing-discount-summary">
                    <span>Discount</span>
                    <strong>
                      {totals.discountApplied > 0
                        ? `-${formatMoney(totals.discountApplied)}`
                        : formatMoney(0)}
                    </strong>
                  </div>
                  <div className="billing-discount-controls">
                    <Select
                      size="small"
                      value={discountType}
                      onChange={(val: DiscountType) => {
                        setDiscountType(val);
                        if (val !== 'PERCENT') {
                          setDiscountPercent(0);
                        }
                        if (val !== 'AMOUNT') {
                          setDiscountAmount(0);
                        }
                      }}
                      options={[
                        { value: 'NONE', label: 'None' },
                        { value: 'PERCENT', label: '%' },
                        { value: 'AMOUNT', label: '₹' },
                      ]}
                    />
                    {discountType === 'PERCENT' && (
                      <InputNumber
                        size="small"
                        min={0}
                        max={100}
                        step={0.5}
                        value={discountPercent}
                        onChange={(val) => setDiscountPercent(Number(val) || 0)}
                        placeholder="%"
                      />
                    )}
                    {discountType === 'AMOUNT' && (
                      <InputNumber
                        size="small"
                        min={0}
                        step={1}
                        value={discountAmount}
                        onChange={(val) => setDiscountAmount(Number(val) || 0)}
                        placeholder="Amount"
                      />
                    )}
                  </div>
                </div>
                <div className="billing-amount-line billing-summary-total">
                  <span>Total</span>
                  <Typography.Title level={5} style={{ margin: 0 }}>
                    {formatMoney(totals.total)}
                  </Typography.Title>
                </div>
              </div>
            </div>
          </div>
        )}
        columns={[
          {
            title: '#',
            width: 48,
            render: (_, __, index) => index + 1,
          },
          {
            title: 'Test',
            dataIndex: 'description',
            render: (text, record) => (
              <input
                value={text}
                onChange={(e) => updateLine(record.key, { description: e.target.value })}
                style={{
                  width: '100%',
                  border: '1px solid #d9d9d9',
                  borderRadius: 6,
                  padding: '4px 8px',
                }}
              />
            ),
          },
          {
            title: 'Qty',
            dataIndex: 'quantity',
            width: 120,
            render: (qty, record) => (
              <InputNumber
                min={0.01}
                step={1}
                value={qty}
                onChange={(val) => updateLine(record.key, { quantity: Number(val) || 1 })}
              />
            ),
          },
          {
            title: 'Rate',
            dataIndex: 'unit_price',
            width: 140,
            render: (rate, record) => (
              <InputNumber
                min={0}
                step={0.01}
                value={rate}
                onChange={(val) => updateLine(record.key, { unit_price: Number(val) || 0 })}
              />
            ),
          },
          {
            title: 'Amount',
            width: 140,
            render: (_, record) => formatMoney(lineAmount(record)),
          },
          {
            title: '',
            width: 56,
            render: (_, record) => (
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                aria-label="Delete row"
                onClick={() => removeLine(record.key)}
              />
            ),
          },
        ]}
      />
    </>
  );
}
