import { DownloadOutlined, PrinterOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, DatePicker, Input, Space, Spin, Statistic, Table, Typography } from 'antd';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { useCallback, useMemo, useState } from 'react';

import { apiClient } from '../../api/client';
import { PageHeader } from '../../components/PageHeader';
import { ErrorBlock, LoadingBlock } from '../../components/QueryState';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { formatMoney } from '../patients/patientRegistrationSchema';
import { formatPaymentMethod } from '../billing/pdf/billPdfFormat';
import { downloadLabBillReportCsv, type LabBillReportMode } from './labBillReportExport';
import {
  collectedByMethodColumns,
  PAYMENT_METHOD_CODES,
  type CollectedByMethod,
} from './reportPaymentMethods';

export type { LabBillReportMode };

type ReportSummary = {
  bill_count: number;
  total_amount: string;
  advance_paid: string;
  balance_due: string;
  collected_by_method: CollectedByMethod;
};

type LabBillReportResponse = {
  date_from: string | null;
  date_to: string | null;
  summary: ReportSummary;
  rows: Record<string, unknown>[];
};

const ENDPOINTS: Record<LabBillReportMode, string> = {
  all: '/reports/lab-bills/',
  doctor: '/reports/lab-bills/by-doctor/',
  hospital: '/reports/lab-bills/by-hospital/',
};

const TITLES: Record<LabBillReportMode, string> = {
  all: 'Lab bill reports',
  doctor: 'Lab bills — doctor wise',
  hospital: 'Lab bills — hospital wise',
};

const SEARCH_PLACEHOLDER: Record<LabBillReportMode, string> = {
  all: 'Bill no., patient name, ID, phone',
  doctor: 'Search doctor name',
  hospital: 'Search hospital name',
};

function defaultRange(): [Dayjs, Dayjs] {
  const end = dayjs().endOf('day');
  const start = dayjs().subtract(30, 'day').startOf('day');
  return [start, end];
}

type LabBillReportsPageProps = {
  mode: LabBillReportMode;
};

export function LabBillReportsPage({ mode }: LabBillReportsPageProps) {
  const [[dateFrom, dateTo], setRange] = useState<[Dayjs, Dayjs]>(defaultRange);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 450);
  const [forPrint, setForPrint] = useState(false);

  const params = useMemo(() => {
    const next: Record<string, string> = {
      date_from: dateFrom.toISOString(),
      date_to: dateTo.toISOString(),
    };
    const term = debouncedSearch.trim();
    if (term) {
      next.search = term;
    }
    return next;
  }, [dateFrom, dateTo, debouncedSearch]);

  const reportQuery = useQuery({
    queryKey: ['reports', 'lab-bills', mode, params],
    queryFn: async () => {
      const { data } = await apiClient.get<LabBillReportResponse>(ENDPOINTS[mode], { params });
      return data;
    },
    placeholderData: keepPreviousData,
  });

  const isInitialLoad = reportQuery.isLoading && !reportQuery.data;
  const isRefreshing = reportQuery.isFetching && !isInitialLoad;

  const methodColumns = useMemo(() => collectedByMethodColumns(), []);

  const columns = useMemo(() => {
    const balanceColumn = {
      title: 'Balance',
      dataIndex: 'balance_due',
      key: 'balance_due',
      align: 'right' as const,
      render: (v: string) => formatMoney(Number(v)),
    };
    const totalColumn = {
      title: 'Total',
      dataIndex: 'total_amount',
      key: 'total_amount',
      align: 'right' as const,
      render: (v: string) => formatMoney(Number(v)),
    };
    const collectedColumn = {
      title: 'Cash collected',
      dataIndex: 'advance_paid',
      key: 'advance_paid',
      align: 'right' as const,
      render: (v: string) => formatMoney(Number(v)),
    };
    if (mode === 'doctor') {
      return [
        { title: 'Doctor', dataIndex: 'doctor_name', key: 'doctor_name' },
        { title: 'Total Bills', dataIndex: 'bill_count', key: 'bill_count', width: 96 },
        totalColumn,
        collectedColumn,
        ...methodColumns,
        balanceColumn,
      ];
    }
    if (mode === 'hospital') {
      return [
        { title: 'Hospital', dataIndex: 'hospital_name', key: 'hospital_name' },
        { title: 'Total Bills', dataIndex: 'bill_count', key: 'bill_count', width: 96 },
        totalColumn,
        collectedColumn,
        ...methodColumns,
        balanceColumn,
      ];
    }
    return [
      { title: 'Bill no.', dataIndex: 'bill_number', key: 'bill_number', width: 120 },
      { title: 'Patient', dataIndex: 'patient_name', key: 'patient_name' },
      { title: 'UHID', dataIndex: 'patient_uhid', key: 'patient_uhid', width: 110 },
      { title: 'Doctor', dataIndex: 'doctor_name', key: 'doctor_name' },
      { title: 'Hospital', dataIndex: 'hospital_name', key: 'hospital_name' },
      {
        title: 'Bill date',
        dataIndex: 'bill_date',
        key: 'bill_date',
        width: 160,
        render: (v: string) =>
          v
            ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(
                new Date(v),
              )
            : '—',
      },
      {
        title: 'Total',
        dataIndex: 'total_amount',
        key: 'total_amount',
        align: 'right' as const,
        render: (v: string) => formatMoney(Number(v)),
      },
      collectedColumn,
      {
        title: 'Payment',
        dataIndex: 'payment_method',
        key: 'payment_method',
        width: 88,
        render: (v: string) => (v ? formatPaymentMethod(v) : '—'),
      },
      balanceColumn,
    ];
  }, [mode, methodColumns]);

  const summary = reportQuery.data?.summary;
  const rows = reportQuery.data?.rows ?? [];
  const canExport = rows.length > 0 && !isInitialLoad;

  const handlePrint = useCallback(() => {
    setForPrint(true);
    const cleanup = () => {
      setForPrint(false);
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    requestAnimationFrame(() => window.print());
  }, []);

  const handleDownload = useCallback(() => {
    if (!rows.length) return;
    downloadLabBillReportCsv(mode, rows, dateFrom, dateTo);
  }, [mode, rows, dateFrom, dateTo]);

  const rangeLabel = `${dateFrom.format('D MMM YYYY')} – ${dateTo.format('D MMM YYYY')}`;

  return (
    <>
      <div className="reports-no-print">
        <PageHeader
          title={TITLES[mode]}
          subtitle="Final lab bills for your branch (bill date)."
          breadcrumbs={[{ title: 'Reports' }, { title: 'Lab bill reports' }, { title: TITLES[mode] }]}
          extra={
            <Space wrap>
              <Button
                icon={<DownloadOutlined />}
                disabled={!canExport}
                onClick={handleDownload}
              >
                Download CSV
              </Button>
              <Button
                icon={<PrinterOutlined />}
                disabled={!canExport}
                onClick={handlePrint}
              >
                Print
              </Button>
            </Space>
          }
        />
      </div>
      <Card className="reports-print-area">
        <div className="reports-print-meta">
          <Typography.Text strong>{TITLES[mode]}</Typography.Text>
          <br />
          <Typography.Text>Bill date: {rangeLabel}</Typography.Text>
        </div>
        <Space wrap className="reports-no-print" style={{ marginBottom: 16 }}>
          <Typography.Text type="secondary">Bill date</Typography.Text>
          <DatePicker.RangePicker
            value={[dateFrom, dateTo]}
            onChange={(values) => {
              if (values?.[0] && values[1]) {
                setRange([values[0].startOf('day'), values[1].endOf('day')]);
              }
            }}
            allowClear={false}
          />
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder={SEARCH_PLACEHOLDER[mode]}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            suffix={
              isRefreshing || search !== debouncedSearch ? (
                <Spin size="small" />
              ) : null
            }
            style={{ width: mode === 'all' ? 300 : 240 }}
          />
        </Space>

        {isInitialLoad ? <LoadingBlock /> : null}
        {reportQuery.isError && !reportQuery.data ? (
          <ErrorBlock message="Could not load report" />
        ) : null}

        {summary ? (
          <>
            <div className="reports-summary-row">
              <Statistic title="Total Bills" value={summary.bill_count} />
              <Statistic title="Total" value={formatMoney(Number(summary.total_amount))} />
              <Statistic title="Cash collected" value={formatMoney(Number(summary.advance_paid))} />
              <Statistic title="Balance due" value={formatMoney(Number(summary.balance_due))} />
            </div>
            {summary.collected_by_method ? (
              <div className="reports-summary-row reports-summary-row--methods">
                {PAYMENT_METHOD_CODES.map((code) => (
                  <Statistic
                    key={code}
                    title={formatPaymentMethod(code)}
                    value={formatMoney(Number(summary.collected_by_method[code] ?? 0))}
                  />
                ))}
              </div>
            ) : null}
          </>
        ) : null}

        {reportQuery.data ? (
          <Table
            size="small"
            rowKey={(row) =>
              String(
                row.id ??
                  row.doctor_id ??
                  row.hospital_id ??
                  `${row.doctor_name}-${row.hospital_name}-${row.bill_number}`,
              )
            }
            columns={columns}
            dataSource={reportQuery.data.rows}
            loading={isRefreshing}
            pagination={
              forPrint
                ? false
                : { pageSize: 25, showSizeChanger: true }
            }
            scroll={{ x: mode === 'all' ? 1200 : mode === 'doctor' || mode === 'hospital' ? 1100 : undefined }}
          />
        ) : null}
        {mode === 'all' && reportQuery.data && reportQuery.data.rows.length >= 500 ? (
          <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>
            Showing the latest 500 bills in this range. Narrow the date filter for a smaller list.
          </Typography.Paragraph>
        ) : null}
      </Card>
    </>
  );
}
