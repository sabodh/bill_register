import {
  AutoComplete,
  Button,
  DatePicker,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import { DeleteOutlined, FilePdfOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';

import { apiClient } from '../../api/client';
import type {
  BillDetailRecord,
  BillRecord,
  Branch,
  Doctor,
  LabPackageRecord,
  LabTestRecord,
  Paginated,
  Patient,
} from '../../api/types/models';
import { ErrorBlock, LoadingBlock } from '../../components/QueryState';
import { useAuth } from '../../auth/AuthContext';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { completeBillPayment } from './completeBillPayment';
import { billPaymentStatus } from './billPayment';
import { billPdfSnapshotFromDetail } from './pdf/billPdfSnapshot';
import { billPdfPageSizeLabel, downloadBillPdfFromDetail } from './pdf/downloadBillPdf';

function formatAgeSex(patient: Patient) {
  const agePart = patient.age_years != null ? `${patient.age_years}y` : '—';
  const sex = { M: 'male', F: 'female', O: 'other' }[patient.gender];
  return `${agePart} / ${sex}`;
}

type GridLine = {
  key: string;
  billing_item: number | null;
  labTestId?: number;
  labPackageId?: number;
  description: string;
  quantity: number;
  unit_price: number;
};

type LabPickerOption = {
  value: string;
  label: string;
  disabled?: boolean;
  kind: 'test' | 'package';
  test?: LabTestRecord;
  package?: LabPackageRecord;
};

function lineCatalogKey(line: GridLine): string | null {
  if (line.labTestId != null) {
    return `test:${line.labTestId}`;
  }
  if (line.labPackageId != null) {
    return `package:${line.labPackageId}`;
  }
  if (line.billing_item != null) {
    return `item:${line.billing_item}`;
  }
  return null;
}

function formatTestPickerLabel(test: LabTestRecord) {
  const rate = formatMoney(Number(test.default_rate));
  const code = test.code ? `Code: ${test.code}` : '';
  const method = test.method_name?.trim() ? `Method: ${test.method_name.trim()}` : '';
  const meta = [code, method].filter(Boolean).join(' - ');
  const dept = test.department_detail?.name ?? '';
  const tail = [dept, rate].filter(Boolean).join(' · ');
  return [test.name, meta, tail].filter(Boolean).join(' — ');
}

function formatPackagePickerLabel(pkg: LabPackageRecord) {
  const rate = formatMoney(Number(pkg.package_amount));
  const count = `${pkg.items.length} test${pkg.items.length === 1 ? '' : 's'}`;
  return `${pkg.name} (Package) — ${count} · ${rate}`;
}

function lineAmount(line: GridLine) {
  return Number((line.quantity * line.unit_price).toFixed(2));
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
}

function billSaveErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.startsWith('Transaction')) {
    return error.message;
  }
  if (isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === 'string' && data.trim()) {
      const text = data.trim();
      if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
        const title = text.match(/<pre class="exception_value">([^<]*)<\/pre>/i)?.[1];
        if (title) {
          return title.replace(/&#x27;/g, "'");
        }
        return 'Server error while saving the bill. Restart the Django API (Stop → ▶ Debug Full Stack).';
      }
      return text.length > 240 ? `${text.slice(0, 240)}…` : text;
    }
    if (data && typeof data === 'object') {
      if ('detail' in data && typeof data.detail === 'string') {
        return data.detail;
      }
      const parts: string[] = [];
      for (const [key, val] of Object.entries(data)) {
        if (Array.isArray(val)) {
          parts.push(`${key}: ${val.map(String).join(' ')}`);
        } else if (typeof val === 'string') {
          parts.push(key === 'non_field_errors' ? val : `${key}: ${val}`);
        }
      }
      if (parts.length > 0) {
        return parts.join(' · ');
      }
    }
    if (error.response?.status === 500) {
      return 'Server error while saving the bill. Restart the API (debug runs with --noreload).';
    }
  }
  return 'Could not save bill';
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
  billId?: number;
  onTitleChange?: (title: string, dirty: boolean) => void;
  onSuccess?: () => void;
};

export function BillingPanel({ billId, onTitleChange, onSuccess }: BillingPanelProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [hospitalId, setHospitalId] = useState<number | null>(null);
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [sampleCollectedAt, setSampleCollectedAt] = useState<Dayjs>(() => dayjs());
  const [sampleTestedAt, setSampleTestedAt] = useState<Dayjs | null>(null);

  const [search, setSearch] = useState('');
  const [lines, setLines] = useState<GridLine[]>([]);
  const [discountType, setDiscountType] = useState<DiscountType>('NONE');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paymentTransactionId, setPaymentTransactionId] = useState('');
  const [advancePaid, setAdvancePaid] = useState<number>(0);
  const [pdfLoading, setPdfLoading] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 300);
  const debouncedPatientSearch = useDebouncedValue(patientSearch, 300);
  const debouncedDoctorSearch = useDebouncedValue(doctorSearch, 300);
  const debouncedHospitalSearch = useDebouncedValue(hospitalSearch, 300);
  const hydratedBillId = useRef<number | null>(null);
  const advanceUserAdjusted = useRef(false);

  const billQuery = useQuery({
    queryKey: ['billing', 'bill', billId],
    enabled: billId != null,
    queryFn: async () =>
      (await apiClient.get<BillDetailRecord>(`/billing/bills/${billId}/`)).data,
  });

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

  const labCatalogQuery = useQuery({
    queryKey: ['billing', 'lab-catalog', debouncedSearch],
    queryFn: async () => {
      const params = { search: debouncedSearch || undefined, page_size: 100 };
      const [testsRes, packagesRes] = await Promise.all([
        apiClient.get<Paginated<LabTestRecord>>('/lab/tests/', { params }),
        apiClient.get<Paginated<LabPackageRecord>>('/lab/packages/', { params }),
      ]);
      return { tests: testsRes.data.results, packages: packagesRes.data.results };
    },
  });

  const selectedCatalogKeys = useMemo(
    () =>
      new Set(
        lines.map((row) => lineCatalogKey(row)).filter((key): key is string => key != null),
      ),
    [lines],
  );

  const options = useMemo((): LabPickerOption[] => {
    const tests = labCatalogQuery.data?.tests ?? [];
    const packages = labCatalogQuery.data?.packages ?? [];
    const testOptions: LabPickerOption[] = tests.map((test) => {
      const catalogKey = `test:${test.id}`;
      const alreadyAdded = selectedCatalogKeys.has(catalogKey);
      return {
        value: catalogKey,
        kind: 'test',
        test,
        disabled: alreadyAdded,
        label: alreadyAdded
          ? `${formatTestPickerLabel(test)} (already added)`
          : formatTestPickerLabel(test),
      };
    });
    const packageOptions: LabPickerOption[] = packages.map((pkg) => {
      const catalogKey = `package:${pkg.id}`;
      const alreadyAdded = selectedCatalogKeys.has(catalogKey);
      return {
        value: catalogKey,
        kind: 'package',
        package: pkg,
        disabled: alreadyAdded,
        label: alreadyAdded
          ? `${formatPackagePickerLabel(pkg)} (already added)`
          : formatPackagePickerLabel(pkg),
      };
    });
    return [...testOptions, ...packageOptions];
  }, [labCatalogQuery.data, selectedCatalogKeys]);

  const addLineFromPicker = (option: LabPickerOption) => {
    if (option.kind === 'test' && option.test) {
      const test = option.test;
      const catalogKey = `test:${test.id}`;
      setLines((prev) => {
        if (prev.some((row) => lineCatalogKey(row) === catalogKey)) {
          message.warning(`"${test.name}" is already on this bill. Change quantity on that row.`);
          return prev;
        }
        return [
          ...prev,
          {
            key: `row-test-${test.id}-${Date.now()}`,
            billing_item: null,
            labTestId: test.id,
            description: test.name,
            quantity: 1,
            unit_price: Number(test.default_rate),
          },
        ];
      });
    } else if (option.kind === 'package' && option.package) {
      const pkg = option.package;
      const catalogKey = `package:${pkg.id}`;
      setLines((prev) => {
        if (prev.some((row) => lineCatalogKey(row) === catalogKey)) {
          message.warning(`"${pkg.name}" is already on this bill. Change quantity on that row.`);
          return prev;
        }
        return [
          ...prev,
          {
            key: `row-package-${pkg.id}-${Date.now()}`,
            billing_item: null,
            labPackageId: pkg.id,
            description: pkg.name,
            quantity: 1,
            unit_price: Number(pkg.package_amount),
          },
        ];
      });
    }
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

  const balanceDue = useMemo(
    () => Math.max(0, Number((totals.total - advancePaid).toFixed(2))),
    [totals.total, advancePaid],
  );
  const paymentStatus = useMemo(() => billPaymentStatus(balanceDue), [balanceDue]);
  const balancePending = balanceDue > 0;

  useEffect(() => {
    if (!advanceUserAdjusted.current) {
      setAdvancePaid(totals.total);
      return;
    }
    if (advancePaid > totals.total) {
      setAdvancePaid(totals.total);
    }
  }, [advancePaid, totals.total]);

  const needsTransactionId = paymentMethod === 'UPI' || paymentMethod === 'CARD';

  const saveDisabledReason = useMemo(() => {
    if (!selectedPatient && lines.length === 0) {
      return 'Select a patient from the list and add at least one test or package.';
    }
    if (!selectedPatient) {
      return 'Pick a patient from the search results — typing alone does not link a patient.';
    }
    if (lines.length === 0) {
      return 'Add at least one test or package to this bill.';
    }
    return null;
  }, [selectedPatient, lines.length]);

  const canSave = saveDisabledReason === null;

  const hasDraft =
    selectedPatient !== null ||
    lines.length > 0 ||
    discountType !== 'NONE' ||
    paymentMethod !== 'CASH' ||
    paymentTransactionId.trim() !== '' ||
    (totals.total > 0 && advancePaid !== totals.total) ||
    search.trim() !== '' ||
    patientSearch.trim() !== '';

  const resetBillForm = () => {
    setSelectedPatient(null);
    setPatientSearch('');
    setDoctorId(null);
    setDoctorSearch('');
    setHospitalId(null);
    setHospitalSearch('');
    setSampleCollectedAt(dayjs());
    setSampleTestedAt(null);
    setLines([]);
    setDiscountType('NONE');
    setDiscountPercent(0);
    setDiscountAmount(0);
    setPaymentMethod('CASH');
    setPaymentTransactionId('');
    setAdvancePaid(0);
    advanceUserAdjusted.current = false;
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

  useEffect(() => {
    if (billId == null) {
      hydratedBillId.current = null;
      advanceUserAdjusted.current = false;
      return;
    }
    const bill = billQuery.data;
    if (!bill || bill.id !== billId) {
      return;
    }
    if (hydratedBillId.current === billId) {
      return;
    }
    hydratedBillId.current = billId;

    if (bill.patient_detail) {
      selectPatient(bill.patient_detail);
    }
    setDoctorId(bill.doctor);
    setDoctorSearch(bill.doctor_name);
    setHospitalId(bill.hospital);
    setHospitalSearch(bill.hospital_name ?? '');
    setSampleCollectedAt(dayjs(bill.sample_collected_at));
    setSampleTestedAt(bill.sample_tested_at ? dayjs(bill.sample_tested_at) : null);
    setDiscountType(bill.discount_type);
    setDiscountPercent(Number(bill.discount_percent));
    setDiscountAmount(Number(bill.discount_amount));
    setPaymentMethod(bill.payment_method);
    setPaymentTransactionId(bill.payment_transaction_id ?? '');
    advanceUserAdjusted.current = true;
    setAdvancePaid(Number(bill.advance_paid ?? 0));
    setLines(
      bill.lines.map((line, index) => ({
        key: `line-${line.id}-${index}`,
        billing_item: line.billing_item,
        labTestId: line.lab_test ?? undefined,
        labPackageId: line.lab_package ?? undefined,
        description: line.description,
        quantity: Number(line.quantity),
        unit_price: Number(line.unit_price),
      })),
    );
    setSearch('');
  }, [billId, billQuery.data, user?.branch_detail?.name]);

  const completePaymentMutation = useMutation({
    mutationFn: () => {
      if (billId == null) {
        throw new Error('No bill selected');
      }
      return completeBillPayment(billId, 'billing');
    },
    onSuccess: (bill) => {
      message.success(`Payment completed — ${bill.bill_number}`);
      advanceUserAdjusted.current = true;
      setAdvancePaid(Number(bill.advance_paid));
      void queryClient.invalidateQueries({ queryKey: ['lab', 'result-bills'] });
      void queryClient.invalidateQueries({ queryKey: ['billing', 'bill', billId] });
    },
    onError: (error) => message.error(billSaveErrorMessage(error)),
  });

  const confirmCompletePayment = () => {
    const billNumber = billQuery.data?.bill_number ?? 'this bill';
    Modal.confirm({
      title: 'Complete payment?',
      content: `Record that the patient paid the full amount for ${billNumber}? Advance will be set to ${formatMoney(totals.total)} and the balance will be zero.`,
      okText: 'Complete payment',
      cancelText: 'Not yet',
      onOk: async () => {
        await completePaymentMutation.mutateAsync();
      },
    });
  };

  const onTitleChangeRef = useRef(onTitleChange);
  onTitleChangeRef.current = onTitleChange;
  const lastTitleReport = useRef<{ title: string; dirty: boolean } | null>(null);

  useEffect(() => {
    const dirty = hasDraft;
    const title =
      (billId != null && billQuery.data?.bill_number) ||
      selectedPatient?.name.trim() ||
      lines[0]?.description?.trim() ||
      '';
    const prev = lastTitleReport.current;
    if (prev && prev.title === title && prev.dirty === dirty) {
      return;
    }
    lastTitleReport.current = { title, dirty };
    onTitleChangeRef.current?.(title, dirty);
  }, [hasDraft, lines, selectedPatient, billId, billQuery.data?.bill_number]);

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
      const payload = {
        patient: selectedPatient.id,
        doctor: doctorId,
        doctor_name: doctorSearch.trim(),
        hospital: hospitalId,
        hospital_name: hospitalSearch.trim(),
        sample_collected_at: sampleCollectedAt.toISOString(),
        sample_tested_at: sampleTestedAt ? sampleTestedAt.toISOString() : null,
        discount_type: discountType,
        discount_percent: discountType === 'PERCENT' ? discountPercent : 0,
        discount_amount: discountType === 'AMOUNT' ? discountAmount : 0,
        advance_paid: advancePaid,
        payment_method: paymentMethod,
        payment_transaction_id: needsTransactionId ? paymentTransactionId.trim() : '',
        lines: lines.map((row) => ({
          billing_item: row.billing_item ?? undefined,
          lab_test: row.labTestId ?? undefined,
          lab_package: row.labPackageId ?? undefined,
          description: row.description,
          quantity: row.quantity,
          unit_price: row.unit_price,
        })),
      };
      if (billId != null) {
        const { data } = await apiClient.put<BillRecord>(`/billing/bills/${billId}/`, payload);
        return data;
      }
      const { data } = await apiClient.post<BillRecord>('/billing/bills/', payload);
      return data;
    },
    onSuccess: (bill) => {
      message.success(
        billId != null ? `Bill updated — ${bill.bill_number}` : `Bill saved — ${bill.bill_number}`,
      );
      void queryClient.invalidateQueries({ queryKey: ['lab', 'result-bills'] });
      void queryClient.invalidateQueries({ queryKey: ['billing', 'bill', billId] });
      if (billId == null) {
        onSuccess?.();
      }
    },
    onError: (error) => message.error(billSaveErrorMessage(error)),
  });

  const handleDownloadPdf = async () => {
    const bill = billQuery.data;
    if (!bill) {
      return;
    }
    setPdfLoading(true);
    try {
      const snapshot = await downloadBillPdfFromDetail(bill);
      message.success(`PDF downloaded (${billPdfPageSizeLabel(snapshot)})`);
    } catch {
      message.error('Could not generate PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const pdfPageHint =
    billQuery.data != null ? billPdfPageSizeLabel(billPdfSnapshotFromDetail(billQuery.data)) : null;

  if (billId != null && billQuery.isLoading) {
    return <LoadingBlock />;
  }
  if (billId != null && billQuery.isError) {
    return <ErrorBlock message="Could not load bill for editing" />;
  }

  return (
    <>
      <div className="billing-form-section">
        <div className="billing-form-section-heading">
          <Typography.Text strong className="billing-form-section-title">Patient</Typography.Text>
          {billId != null && billQuery.data ? (
            <Button
              size="small"
              icon={<FilePdfOutlined />}
              loading={pdfLoading}
              onClick={() => void handleDownloadPdf()}
            >
              Download PDF{pdfPageHint ? ` (${pdfPageHint})` : ''}
            </Button>
          ) : null}
        </div>
        <AutoComplete
          style={{ width: '100%', maxWidth: 520 }}
          value={patientSearch}
          options={patientOptions}
          status={patientSearch.trim() && !selectedPatient ? 'warning' : undefined}
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
        {patientSearch.trim() && !selectedPatient && (
          <Typography.Paragraph type="warning" className="billing-add-test-hint">
            Choose a patient from the dropdown (search needs at least 2 characters).
          </Typography.Paragraph>
        )}
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
              style={{ width: '100%' }}
              value={sampleCollectedAt}
              onChange={(value) => value && setSampleCollectedAt(value)}
            />
          </div>
          <div className="billing-context-field">
            <Typography.Text type="secondary" className="billing-grid-label">
              Sample tested
            </Typography.Text>
            <DatePicker
              showTime
              format="DD MMM YYYY, hh:mm A"
              style={{ width: '100%' }}
              value={sampleTestedAt}
              onChange={(value) => setSampleTestedAt(value)}
              allowClear
              onClear={() => setSampleTestedAt(null)}
            />
          </div>
        </div>
      </div>

      <div className="billing-form-section">
        <Typography.Text strong className="billing-form-section-title">Add test or package</Typography.Text>
        <AutoComplete
          style={{ width: '100%', maxWidth: 520 }}
          options={options}
          value={search}
          onSearch={setSearch}
          onSelect={(value) => {
            const match = options.find((o) => o.value === value);
            if (match) {
              addLineFromPicker(match);
            }
          }}
          placeholder="Search lab test or package name"
          notFoundContent={labCatalogQuery.isLoading ? 'Loading…' : 'No tests or packages found'}
          onFocus={() => labCatalogQuery.refetch()}
        />
        <Typography.Paragraph type="secondary" className="billing-add-test-hint">
          Loaded from lab tests and packages you saved under Lab → Test / Package.
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
                  <Tooltip title={saveDisabledReason ?? undefined}>
                    <span className="billing-save-button-wrap">
                      <Button
                        type="primary"
                        size="middle"
                        onClick={() => saveMutation.mutate()}
                        loading={saveMutation.isPending}
                        disabled={!canSave}
                      >
                        {billId != null ? 'Update bill' : 'Save bill'}
                      </Button>
                    </span>
                  </Tooltip>
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
                <div className="billing-amount-line">
                  <span>Advance payment</span>
                  <InputNumber
                    size="small"
                    min={0}
                    max={totals.total}
                    step={1}
                    value={advancePaid}
                    onChange={(val) => {
                      advanceUserAdjusted.current = true;
                      setAdvancePaid(Math.min(totals.total, Number(val) || 0));
                    }}
                    formatter={(val) =>
                      val != null && String(val).length > 0 ? `₹ ${val}` : ''
                    }
                    parser={(val) => Number((val ?? '').replace(/[₹\s,]/g, '')) || 0}
                    style={{ width: 120 }}
                  />
                </div>
                {balancePending ? (
                  <>
                    <div className="billing-amount-line billing-balance-line--pending">
                      <span>Balance due</span>
                      <strong className="billing-balance-pending-amount">{formatMoney(balanceDue)}</strong>
                    </div>
                    {paymentStatus ? (
                      <div className="billing-amount-line billing-payment-status-row">
                        <span>Billing status</span>
                        <Tag color={paymentStatus.color} className="billing-payment-status-tag">
                          {paymentStatus.label}
                        </Tag>
                      </div>
                    ) : null}
                  </>
                ) : null}
                {billId != null && balancePending ? (
                  <Button
                    type="default"
                    size="small"
                    className="billing-complete-payment-btn"
                    loading={completePaymentMutation.isPending}
                    onClick={confirmCompletePayment}
                  >
                    Complete payment
                  </Button>
                ) : null}
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
