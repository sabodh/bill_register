import { Button, Divider, Empty, Typography, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import { apiClient } from '../../api/client';
import { apiErrorMessage } from '../../api/apiErrorMessage';
import type { LabResultBillDetail, LabTestCategory } from '../../api/types/models';
import {
  BillVisitContextFields,
  billVisitContextFromDetail,
  billVisitContextToLabSessionPayload,
  defaultBillVisitContext,
  type BillVisitContextState,
} from '../../components/BillVisitContextFields';
import { ErrorBlock, LoadingBlock } from '../../components/QueryState';
import { LabTestResultEntryPreview } from './LabTestResultEntryPreview';
import {
  collectResultPayload,
  hydrateResultValuesFromBill,
  resultValueKey,
} from './labResultValues';

type LabResultBillWorkspaceProps = {
  billId: number | null;
  onDirtyChange?: (dirty: boolean) => void;
  onBillNumberChange?: (billNumber: string) => void;
};

function snapshot(ctx: BillVisitContextState, values: Record<string, string>): string {
  return JSON.stringify({
    ctx: billVisitContextToLabSessionPayload(ctx),
    values,
  });
}

export function LabResultBillWorkspace({
  billId,
  onDirtyChange,
  onBillNumberChange,
}: LabResultBillWorkspaceProps) {
  const queryClient = useQueryClient();
  const savedSnapshotRef = useRef<string>('');
  const hydratedBillId = useRef<number | null>(null);
  const onDirtyChangeRef = useRef(onDirtyChange);
  const onBillNumberChangeRef = useRef(onBillNumberChange);
  onDirtyChangeRef.current = onDirtyChange;
  onBillNumberChangeRef.current = onBillNumberChange;

  const [visitContext, setVisitContext] = useState<BillVisitContextState>(() => defaultBillVisitContext());
  const [resultValues, setResultValues] = useState<Record<string, string>>({});

  const detailQuery = useQuery({
    queryKey: ['lab', 'result-bill', billId],
    enabled: billId != null,
    queryFn: async () =>
      (await apiClient.get<LabResultBillDetail>(`/lab/result-bills/${billId}/`)).data,
  });

  useEffect(() => {
    hydratedBillId.current = null;
    if (billId == null) {
      setVisitContext(defaultBillVisitContext());
      setResultValues({});
      savedSnapshotRef.current = '';
      onDirtyChangeRef.current?.(false);
    }
  }, [billId]);

  useEffect(() => {
    const detail = detailQuery.data;
    if (!detail || detail.id !== billId) {
      return;
    }
    if (hydratedBillId.current !== detail.id) {
      hydratedBillId.current = detail.id;
      onBillNumberChangeRef.current?.(detail.bill_number);
      const ctx = billVisitContextFromDetail(detail);
      const values = hydrateResultValuesFromBill(detail);
      setVisitContext(ctx);
      setResultValues(values);
      savedSnapshotRef.current = snapshot(ctx, values);
      onDirtyChangeRef.current?.(false);
    }
  }, [detailQuery.data, billId]);

  const markDirtyIfNeeded = (
    nextCtx: BillVisitContextState,
    nextValues: Record<string, string>,
  ) => {
    onDirtyChangeRef.current?.(snapshot(nextCtx, nextValues) !== savedSnapshotRef.current);
  };

  const saveResultsMutation = useMutation({
    mutationFn: async () => {
      if (billId == null || !detailQuery.data) {
        throw new Error('No bill selected');
      }
      const payload = {
        ...billVisitContextToLabSessionPayload(visitContext),
        results: collectResultPayload(detailQuery.data.work_items, resultValues),
      };
      return (
        await apiClient.post<LabResultBillDetail>(
          `/lab/result-bills/${billId}/save-results/`,
          payload,
        )
      ).data;
    },
    onSuccess: (data) => {
      message.success('Results saved');
      const values = hydrateResultValuesFromBill(data);
      const ctx = billVisitContextFromDetail(data);
      setResultValues(values);
      setVisitContext(ctx);
      savedSnapshotRef.current = snapshot(ctx, values);
      onDirtyChange?.(false);
      void queryClient.setQueryData(['lab', 'result-bill', data.id], data);
      void queryClient.invalidateQueries({ queryKey: ['lab', 'result-bills'] });
    },
    onError: (error) => message.error(apiErrorMessage(error, 'Could not save results')),
  });

  if (billId == null) {
    return (
      <Empty description="Choose a bill on the right to open it in this tab, or use + for another tab." />
    );
  }

  if (detailQuery.isLoading) {
    return <LoadingBlock />;
  }

  if (detailQuery.isError || !detailQuery.data) {
    return <ErrorBlock message="Could not load bill" />;
  }

  const bill = detailQuery.data;

  return (
    <>
      <div className="billing-form-section lab-results-visit-context">
        <Typography.Text strong className="billing-form-section-title">Visit details</Typography.Text>
        <BillVisitContextFields
          value={visitContext}
          onChange={(patch) => {
            setVisitContext((prev) => {
              const next = { ...prev, ...patch };
              markDirtyIfNeeded(next, resultValues);
              return next;
            });
          }}
        />
      </div>
      <Divider className="lab-results-section-divider" />
      <LabResultBillDetailPanel
        bill={bill}
        resultValues={resultValues}
        onResultValueChange={(billLineId, labTestId, resultKey, value) => {
          setResultValues((prev) => {
            const next = {
              ...prev,
              [resultValueKey(billLineId, labTestId, resultKey)]: value,
            };
            markDirtyIfNeeded(visitContext, next);
            return next;
          });
        }}
      />
      <div className="lab-results-save-footer">
        <Button
          type="primary"
          size="large"
          loading={saveResultsMutation.isPending}
          onClick={() => saveResultsMutation.mutate()}
        >
          Save result
        </Button>
      </div>
    </>
  );
}

function LabResultBillDetailPanel({
  bill,
  resultValues,
  onResultValueChange,
}: {
  bill: LabResultBillDetail;
  resultValues: Record<string, string>;
  onResultValueChange: (
    billLineId: number,
    labTestId: number,
    resultKey: string,
    value: string,
  ) => void;
}) {
  const valuesForWorkItem = (billLineId: number, labTestId: number) => {
    const prefix = `${billLineId}:${labTestId}:`;
    const scoped: Record<string, string> = {};
    for (const [key, value] of Object.entries(resultValues)) {
      if (key.startsWith(prefix)) {
        scoped[key.slice(prefix.length)] = value;
      }
    }
    return scoped;
  };

  return (
    <div className="lab-results-detail-panel">
      <Typography.Title level={5} style={{ marginTop: 0 }}>
        {bill.bill_number}
      </Typography.Title>
      {bill.work_items.length === 0 ? (
        <Empty description="No lab tests on this bill" />
      ) : (
        <div className="lab-all-tests-scroll">
          {bill.work_items.map((item) => (
            <div key={`${item.bill_line_id}-${item.lab_test_id}`} className="lab-test-full-form-card">
              {item.from_package && item.package_name ? (
                <Typography.Text type="secondary" className="lab-results-package-tag">
                  Package: {item.package_name}
                </Typography.Text>
              ) : null}
              {item.result_entry_layout.layout === 'billing_only' ? (
                <Typography.Text>{item.test_name} (billing only)</Typography.Text>
              ) : (
                <LabTestResultEntryPreview
                  editable
                  layout={item.result_entry_layout}
                  testCategory={item.test_category as LabTestCategory}
                  title={item.test_name}
                  methodName={item.method_name}
                  departmentName={item.department_name}
                  draftRanges={[]}
                  values={valuesForWorkItem(item.bill_line_id, item.lab_test_id)}
                  onValueChange={(resultKey, value) =>
                    onResultValueChange(item.bill_line_id, item.lab_test_id, resultKey, value)
                  }
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
