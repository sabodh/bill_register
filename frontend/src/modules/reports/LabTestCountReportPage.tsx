import { DownloadOutlined, PrinterOutlined, SearchOutlined } from '@ant-design/icons';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Button, Card, DatePicker, Input, Space, Spin, Statistic, Table, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useCallback, useMemo, useState } from 'react';

import { apiClient } from '../../api/client';
import { PageHeader } from '../../components/PageHeader';
import { ErrorBlock, LoadingBlock } from '../../components/QueryState';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { formatLabTestTypeTier } from '../lab/labTestTypeTier';
import { downloadLabTestCountCsv } from './labTestCountExport';

type TestCountSummary = {
  test_types: number;
  total_tests: string;
};

type TestCountReportResponse = {
  date_from: string | null;
  date_to: string | null;
  summary: TestCountSummary;
  rows: Record<string, unknown>[];
};

function defaultRange(): [Dayjs, Dayjs] {
  const end = dayjs().endOf('day');
  const start = dayjs().subtract(30, 'day').startOf('day');
  return [start, end];
}

export function LabTestCountReportPage() {
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
    queryKey: ['reports', 'lab-test-count', params],
    queryFn: async () => {
      const { data } = await apiClient.get<TestCountReportResponse>('/reports/lab-tests/count/', {
        params,
      });
      return data;
    },
    placeholderData: keepPreviousData,
  });

  const isInitialLoad = reportQuery.isLoading && !reportQuery.data;
  const isRefreshing = reportQuery.isFetching && !isInitialLoad;
  const rows = reportQuery.data?.rows ?? [];
  const summary = reportQuery.data?.summary;
  const canExport = rows.length > 0 && !isInitialLoad;
  const rangeLabel = `${dateFrom.format('D MMM YYYY')} – ${dateTo.format('D MMM YYYY')}`;

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
    downloadLabTestCountCsv(rows, dateFrom, dateTo);
  }, [rows, dateFrom, dateTo]);

  const columns = useMemo(
    () => [
      { title: 'Test', dataIndex: 'test_name', key: 'test_name' },
      { title: 'Code', dataIndex: 'test_code', key: 'test_code', width: 100 },
      { title: 'Department', dataIndex: 'department_name', key: 'department_name', width: 140 },
      {
        title: 'Test type',
        dataIndex: 'test_type_label',
        key: 'test_type_label',
        width: 88,
        render: (v: string, row: Record<string, unknown>) =>
          v || formatLabTestTypeTier(String(row.test_type ?? '')),
      },
      {
        title: 'Test count',
        dataIndex: 'test_count',
        key: 'test_count',
        width: 110,
        align: 'right' as const,
      },
    ],
    [],
  );

  return (
    <>
      <div className="reports-no-print">
        <PageHeader
          title="Lab test count"
          subtitle="Number of each lab test on final bills (bill date)."
          breadcrumbs={[
            { title: 'Reports' },
            { title: 'Lab bill reports' },
            { title: 'Test count' },
          ]}
          extra={
            <Space wrap>
              <Button icon={<DownloadOutlined />} disabled={!canExport} onClick={handleDownload}>
                Download CSV
              </Button>
              <Button icon={<PrinterOutlined />} disabled={!canExport} onClick={handlePrint}>
                Print
              </Button>
            </Space>
          }
        />
      </div>
      <Card className="reports-print-area">
        <div className="reports-print-meta">
          <Typography.Text strong>Lab test count</Typography.Text>
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
            placeholder="Name, code, department, or type"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            suffix={
              isRefreshing || search !== debouncedSearch ? <Spin size="small" /> : null
            }
            style={{ width: 240 }}
          />
        </Space>

        {isInitialLoad ? <LoadingBlock /> : null}
        {reportQuery.isError && !reportQuery.data ? (
          <ErrorBlock message="Could not load report" />
        ) : null}

        {summary ? (
          <div className="reports-summary-row">
            <Statistic title="Test types" value={summary.test_types} />
            <Statistic title="Total tests" value={summary.total_tests} />
          </div>
        ) : null}

        {reportQuery.data ? (
          <Table
            size="small"
            rowKey={(row) => String(row.lab_test_id)}
            columns={columns}
            dataSource={reportQuery.data.rows}
            loading={isRefreshing}
            pagination={forPrint ? false : { pageSize: 25, showSizeChanger: true }}
          />
        ) : null}
      </Card>
    </>
  );
}
