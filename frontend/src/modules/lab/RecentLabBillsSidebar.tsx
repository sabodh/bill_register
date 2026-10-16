import { Card, Empty, Input, Tabs, Tag, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { apiClient } from '../../api/client';
import type { LabResultBillSummary, Paginated } from '../../api/types/models';
import { ErrorBlock, LoadingBlock } from '../../components/QueryState';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { billBalanceDue, billPaymentStatus } from '../billing/billPayment';
import { RecentBillCardActions } from '../billing/RecentBillCardActions';
import type { BillPdfSnapshot } from '../billing/pdf/billPdfTypes';
import { formatMoney } from '../patients/patientRegistrationSchema';

function formatSampleDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

type ResultsWorklistTab = 'pending' | 'completed';

type RecentLabBillsSidebarProps = {
  title: string;
  selectedBillId: number | null;
  onSelectBill: (billId: number, bill?: LabResultBillSummary) => void;
  patientId?: number | null;
  onEditBill?: (billId: number) => void;
  onBillCancelled?: (billId: number) => void;
  onPreviewBillPdf?: (snapshot: BillPdfSnapshot) => void;
  onPreviewResultPdf?: (billId: number) => void;
  emptyDescription: string;
  selectPatientHint?: string;
  /** Lab results page: Pending vs Completed worklists + status tags on cards */
  resultWorklistTabs?: boolean;
};

function LabResultBillCard({
  bill,
  selected,
  onSelectBill,
  onEditBill,
  onBillCancelled,
  onPreviewBillPdf,
  onPreviewResultPdf,
  showResultStatus,
}: {
  bill: LabResultBillSummary;
  selected: boolean;
  onSelectBill: (billId: number, bill?: LabResultBillSummary) => void;
  onEditBill?: (billId: number) => void;
  onBillCancelled?: (billId: number) => void;
  onPreviewBillPdf?: (snapshot: BillPdfSnapshot) => void;
  onPreviewResultPdf?: (billId: number) => void;
  showResultStatus: boolean;
}) {
  const balanceDue = billBalanceDue(bill);
  const paymentStatus = billPaymentStatus(balanceDue);
  const balancePending = balanceDue > 0;

  return (
    <Card
      size="small"
      hoverable
      className={`doctor-list-card lab-results-bill-card${selected ? ' doctor-list-card--selected' : ''}`}
      onClick={() => onSelectBill(bill.id, showResultStatus ? bill : undefined)}
    >
      <div className="lab-bill-card-header">
        <div className="lab-bill-card-header-main">
          <Typography.Text strong className="doctor-list-card-name lab-bill-card-number">
            {bill.bill_number}
          </Typography.Text>
          {paymentStatus ? (
            <Tag className="lab-results-status-tag" color={paymentStatus.color}>
              {paymentStatus.label}
            </Tag>
          ) : null}
          {showResultStatus ? (
            <Tag
              className="lab-results-status-tag"
              color={bill.results_completed ? 'success' : 'warning'}
            >
              {bill.results_completed ? 'Results completed' : 'Results pending'}
            </Tag>
          ) : null}
        </div>
        <div className="lab-bill-card-header-menu">
          <RecentBillCardActions
            billId={bill.id}
            billNumber={bill.bill_number}
            balanceDue={balanceDue}
            billTotal={Number(bill.total_amount)}
            onEdit={onEditBill}
            onCancelled={onBillCancelled}
            onPreviewPdf={onPreviewBillPdf}
            onPreviewResultPdf={onPreviewResultPdf}
            showResultReportPdf={showResultStatus}
          />
        </div>
      </div>
      <Typography.Text className="doctor-list-card-meta lab-bill-card-patient-line">
        <span className="lab-bill-card-patient-name">{bill.patient_name}</span>
        <span className="lab-bill-card-patient-uhid"> · {bill.patient_uhid}</span>
      </Typography.Text>
      <Typography.Text type="secondary" className="doctor-list-card-meta">
        {formatSampleDate(bill.sample_collected_at)} · {bill.work_item_count} test
        {bill.work_item_count === 1 ? '' : 's'}
        {showResultStatus && bill.result_slots_total > 0 ? (
          <> · {bill.result_slots_filled}/{bill.result_slots_total} results</>
        ) : null}
      </Typography.Text>
      <div className="lab-test-list-card-dept-row">
        <Typography.Text type="secondary" className="doctor-list-card-meta">Bill total</Typography.Text>
        <Typography.Text type="secondary" className="doctor-list-card-meta lab-test-list-card-amount">
          {formatMoney(Number(bill.total_amount))}
        </Typography.Text>
      </div>
      {balancePending ? (
        <>
          {Number(bill.advance_paid ?? 0) > 0 ? (
            <div className="lab-test-list-card-dept-row">
              <Typography.Text type="secondary" className="doctor-list-card-meta">Advance</Typography.Text>
              <Typography.Text type="secondary" className="doctor-list-card-meta lab-test-list-card-amount">
                {formatMoney(Number(bill.advance_paid ?? 0))}
              </Typography.Text>
            </div>
          ) : null}
          <div className="lab-test-list-card-dept-row lab-bill-card-balance--pending">
            <Typography.Text type="secondary" className="doctor-list-card-meta">Balance due</Typography.Text>
            <Typography.Text className="doctor-list-card-meta lab-test-list-card-amount lab-bill-card-balance-amount">
              {formatMoney(balanceDue)}
            </Typography.Text>
          </div>
        </>
      ) : null}
    </Card>
  );
}

export function RecentLabBillsSidebar({
  title,
  selectedBillId,
  onSelectBill,
  patientId = undefined,
  onEditBill,
  onBillCancelled,
  onPreviewBillPdf,
  onPreviewResultPdf,
  emptyDescription,
  selectPatientHint = 'Select a patient to load their bills.',
  resultWorklistTabs = false,
}: RecentLabBillsSidebarProps) {
  const [search, setSearch] = useState('');
  const [worklistTab, setWorklistTab] = useState<ResultsWorklistTab>('pending');
  const debouncedSearch = useDebouncedValue(search, 300);
  const requirePatient = patientId !== undefined;
  const searchActive = debouncedSearch.trim().length > 0;
  const canFetch =
    !requirePatient || patientId != null || (resultWorklistTabs && searchActive);
  const searchDisabled = requirePatient && !resultWorklistTabs && patientId == null;

  const listQuery = useQuery({
    queryKey: [
      'lab',
      'result-bills',
      patientId ?? 'all',
      debouncedSearch,
      resultWorklistTabs ? worklistTab : 'all',
    ],
    enabled: canFetch,
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<LabResultBillSummary>>('/lab/result-bills/', {
        params: {
          patient: patientId ?? undefined,
          search: debouncedSearch || undefined,
          page_size: 50,
          results_status: resultWorklistTabs ? worklistTab : undefined,
        },
      });
      return data.results;
    },
  });

  const filteredBills = useMemo(() => listQuery.data ?? [], [listQuery.data]);

  const emptyForTab =
    worklistTab === 'pending'
      ? 'No bills waiting for results — all caught up for this patient.'
      : 'No bills with completed results yet for this patient.';

  return (
    <aside className="lab-bills-sidebar" aria-label={title}>
      <Typography.Title level={5} style={{ margin: 0 }}>{title}</Typography.Title>
      {resultWorklistTabs ? (
        <Tabs
          size="small"
          className="lab-results-worklist-tabs"
          activeKey={worklistTab}
          onChange={(key) => setWorklistTab(key as ResultsWorklistTab)}
          items={[
            { key: 'pending', label: 'Pending results' },
            { key: 'completed', label: 'Completed results' },
          ]}
        />
      ) : null}
      <Input
        placeholder={
          resultWorklistTabs
            ? 'Search bill number'
            : requirePatient
              ? 'Search bill number'
              : 'Search bill no., patient, UHID'
        }
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        allowClear
        disabled={searchDisabled}
      />
      {requirePatient && patientId == null && !searchActive && resultWorklistTabs ? (
        <Typography.Text type="secondary" className="lab-results-sidebar-hint">
          Search by bill number or select a patient on the left.
        </Typography.Text>
      ) : null}
      {!canFetch ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={selectPatientHint} />
      ) : null}
      {canFetch && listQuery.isLoading ? <LoadingBlock /> : null}
      {canFetch && listQuery.isError ? <ErrorBlock message="Could not load bills" /> : null}
      {canFetch && !listQuery.isLoading && !listQuery.isError && filteredBills.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={resultWorklistTabs ? emptyForTab : emptyDescription}
        />
      ) : null}
      <div className="doctor-list-panel-scroll">
        {canFetch &&
          filteredBills.map((bill) => (
            <LabResultBillCard
              key={bill.id}
              bill={bill}
              selected={selectedBillId === bill.id}
              onSelectBill={onSelectBill}
              onEditBill={onEditBill}
              onBillCancelled={onBillCancelled}
              onPreviewBillPdf={onPreviewBillPdf}
              onPreviewResultPdf={onPreviewResultPdf}
              showResultStatus={resultWorklistTabs}
            />
          ))}
      </div>
    </aside>
  );
}
